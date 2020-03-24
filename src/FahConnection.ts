// import "src/types.d.ts";
import { EventEmitter } from "events";
import Telnet, { ConnectOptions } from "telnet-client";

export default class FahConnection extends EventEmitter {
    log: ioBroker.Logger;
    telnetClient: Telnet;
    connectionParams: ConnectOptions;
    password: string;
    connectionAddress: string;
    connectionId: string;

    fah: { alive: boolean; options: FahOptionsType; slots: [FahSlotType?]; queue: [FahQueueEntryType?] };

    isShuttingDown: boolean;
    heartbeatTimeout: undefined | NodeJS.Timeout;
    reconnectTimeout: undefined | NodeJS.Timeout;
    isConnected: boolean;
    isConnecting: boolean;
    shellPrompt: string;
    reconnectDelay: number;

    constructor(log: ioBroker.Logger, host: string, port: number, password = "", reconnectDelay = 300000) {
        super();

        // Bind this to function
        this.onData = this.onData.bind(this);

        this.log = log;
        this.telnetClient = new Telnet();
        this.connectionParams = {
            host,
            port,
            shellPrompt: "> ",
            timeout: 15000,
            debug: true,
            irs: "\n",
        };
        this.password = password;

        this.connectionAddress = `${host}:${port}`;
        this.connectionId = this.connectionAddress.replace(/\W+/g, "_");
        this.log.info(`[${this.connectionId}] created connection to ${this.connectionAddress}`);

        this.isShuttingDown = false;
        this.isConnected = false;
        this.isConnecting = false;
        this.shellPrompt = "> ";
        this.reconnectDelay = reconnectDelay;

        this.fah = {
            alive: false,
            options: { user: "", team: "", cause: "", power: "" },
            slots: [],
            queue: [],
        };

        this.telnetClient.on("timeout", () => {
            this.log.warn(`[${this.connectionId}] timeout`);
            this.telnetClient.end();
        });
        this.telnetClient.on("close", () => {
            if (this.heartbeatTimeout) {
                clearTimeout(this.heartbeatTimeout);
                this.heartbeatTimeout = undefined;
            }

            this.emit("aliveUpdate", this, false);
            this.fah.alive = false;

            this.log.info(`[${this.connectionId}] closed`);
            this.emit("connectionUpdate", this, "disconnected");

            this.isConnected = false;
            if (!this.isShuttingDown && !this.reconnectTimeout) {
                // try {
                this.reconnectTimeout = setTimeout(() => {
                    this.reconnectTimeout = undefined;
                    this.log.info(`[${this.connectionId}] reconnect...`);
                    this.isConnecting = true;
                    this.telnetClient.connect(this.connectionParams);
                }, this.reconnectDelay);
                // } catch (error) {
                //     this.log.error(`[${this.connectionId}] reconnect error:\n${error}`);
                // }
            }
        });
        this.telnetClient.on("data", this.onData);
    }

    async connect(): Promise<void> {
        this.log.info(`[${this.connectionId}] connecting...`);
        this.emit("connectionUpdate", this, "connecting");
        this.isConnecting = true;

        try {
            await this.telnetClient.connect(this.connectionParams);

            let res = "";
            this.isConnected = true;
            this.emit("connectionUpdate", this, "connected");

            this.isConnecting = false;
            if (this.password !== "") {
                res = await this.telnetClient.exec(`auth ${this.password}`);
                this.log.info(`[${this.connectionId}] auth: ${res}`);
            }

            res = await this.telnetClient.exec("updates clear\n");
            res = await this.telnetClient.exec("updates add 0 5 $heartbeat\n");
            this.onData(res);
            res = await this.telnetClient.exec("updates add 1 1 $(options user team cause power)\n");
            this.onData(res);
            res = await this.telnetClient.exec("updates add 2 5 $queue-info\n");
            this.onData(res);
            res = await this.telnetClient.exec("updates add 3 5 $slot-info\n");
            this.onData(res);

            this.log.info(`[${this.connectionId}] connected`);
        } catch (error) {
            this.log.error(`[${this.connectionId}] connection error:\n${error}`);
            this.emit("connectionUpdate", this, "error");
        }
    }

    async closeConnection(): Promise<void> {
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = undefined;
        }
        if (this.heartbeatTimeout) {
            clearTimeout(this.heartbeatTimeout);
            this.heartbeatTimeout = undefined;
        }

        this.isShuttingDown = true;
        return new Promise((resolve) => {
            this.telnetClient.on("close", () => {
                this.emit("connectionUpdate", this, "disconnected");
                this.emit("aliveUpdate", this, false);
                this.fah.alive = false;
                resolve();
            });
            this.telnetClient.end().catch((e) => {
                this.log.error(`[${this.connectionId}] disconnect error:\n${e}`);
                this.telnetClient.destroy();
                resolve();
            });
        });
    }

    parsePyON(PyONString: string): ParsedPyONType {
        const matches = PyONString.match(/PyON (\d+) (\w+)\n([\s\S]+?)\n---/m);
        if (matches === null) {
            return { isPyON: false, error: false };
        } else {
            let jsonString = matches[3];
            jsonString = jsonString.replace(/False|"false"/g, "false");
            jsonString = jsonString.replace(/True|"true"/g, "true");
            jsonString = jsonString.replace(/NULL/g, "null");
            jsonString = '{"' + matches[2] + '":' + jsonString + "}";
            try {
                const obj = JSON.parse(jsonString);
                return { isPyON: true, version: matches[1], command: matches[2], obj, error: false };
            } catch (error) {
                this.log.error(`[${this.connectionId}] parse error:\n${error}`);
                this.log.error(PyONString);
                return { isPyON: true, version: matches[1], command: matches[2], error: true };
            }
        }
    }

    onData(data: Buffer | string): void {
        const msg = data.toString();
        // this.log.debug(`[${this.connectionId}] data:\n${msg}`);
        let match: RegExpMatchArray | null = null;
        const regexp = /PyON \d+ \w+\n[\s\S]+?\n---/g;
        while ((match = regexp.exec(msg)) !== null) {
            const command = this.parsePyON(match[0]);
            if (command.isPyON) {
                if (command.error) {
                    this.emit("dataError", this.connectionId, command);
                } else {
                    this.log.debug(`[${this.connectionId}] command:\n${command.command}`);
                    switch (command.command) {
                        case "units":
                            this.emit("queueUpdate", this, command.obj.units);
                            this.fah.queue = command.obj.units;
                            break;
                        case "slots":
                            this.emit("slotsUpdate", this, command.obj.slots);
                            this.fah.slots = command.obj.slots;
                            break;
                        case "options":
                            this.emit("optionsUpdate", this, command.obj.options);
                            this.fah.options = command.obj.options;
                            break;
                        case "heartbeat":
                            this.emit("aliveUpdate", this, true);
                            this.fah.alive = true;
                            if (this.heartbeatTimeout) {
                                clearTimeout(this.heartbeatTimeout);
                                this.heartbeatTimeout = undefined;
                            }
                            if (!this.isShuttingDown) {
                                this.heartbeatTimeout = setTimeout(() => {
                                    this.emit("aliveUpdate", this, false);
                                    this.fah.alive = false;
                                }, 15000);
                            }

                        default:
                            break;
                    }
                }
            }
        }
        // const matches = msg.matchAll(/PyON \d+ (\w+)\n[\s\S]+?\n---/m);
        // for (const match of matches) {
        //     this.adapter.log.info(JSON.stringify(this.parsePyON(match)));
        // }
    }
}
