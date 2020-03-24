"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// import "src/types.d.ts";
const events_1 = require("events");
const telnet_client_1 = __importDefault(require("telnet-client"));
class FahConnection extends events_1.EventEmitter {
    constructor(log, host, port, password = "", reconnectDelay = 300000) {
        super();
        // Bind this to function
        this.onData = this.onData.bind(this);
        this.log = log;
        this.telnetClient = null;
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
    }
    async connect() {
        this.log.info(`[${this.connectionId}] connecting...`);
        this.emit("connectionUpdate", this, "connecting");
        this.isConnecting = true;
        if (this.telnetClient !== null) {
            throw "connection already open, disconnect first";
        }
        this.telnetClient = new telnet_client_1.default();
        this.telnetClient.on("timeout", () => {
            this.log.warn(`[${this.connectionId}] timeout`);
            if (this.telnetClient !== null) {
                this.telnetClient.end();
            }
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
            this.telnetClient = null;
            this.isConnected = false;
            if (!this.isShuttingDown && !this.reconnectTimeout) {
                this.reconnectTimeout = setTimeout(() => {
                    this.reconnectTimeout = undefined;
                    this.log.info(`[${this.connectionId}] try to reconnect`);
                    this.isConnecting = true;
                    this.connect();
                }, this.reconnectDelay);
            }
        });
        this.telnetClient.on("data", this.onData);
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
        }
        catch (error) {
            this.log.error(`[${this.connectionId}] connection error:\n${error}`);
            this.emit("connectionUpdate", this, "error");
        }
    }
    async closeConnection() {
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = undefined;
        }
        if (this.heartbeatTimeout) {
            clearTimeout(this.heartbeatTimeout);
            this.heartbeatTimeout = undefined;
        }
        this.isShuttingDown = true;
        await new Promise((resolve) => {
            if (this.telnetClient !== null) {
                this.telnetClient.on("close", () => {
                    this.emit("connectionUpdate", this, "disconnected");
                    this.emit("aliveUpdate", this, false);
                    this.fah.alive = false;
                    resolve();
                });
                this.telnetClient.end().catch((e) => {
                    this.log.error(`[${this.connectionId}] disconnect error:\n${e}`);
                    if (this.telnetClient !== null) {
                        this.telnetClient.destroy();
                        this.telnetClient = null;
                    }
                    resolve();
                });
            }
            else {
                resolve();
            }
        });
    }
    parsePyON(PyONString) {
        const matches = PyONString.match(/PyON (\d+) (\w+)\n([\s\S]+?)\n---/m);
        if (matches === null) {
            return { isPyON: false, error: false };
        }
        else {
            let jsonString = matches[3];
            jsonString = jsonString.replace(/False|"false"/g, "false");
            jsonString = jsonString.replace(/True|"true"/g, "true");
            jsonString = jsonString.replace(/NULL/g, "null");
            jsonString = '{"' + matches[2] + '":' + jsonString + "}";
            try {
                const obj = JSON.parse(jsonString);
                return { isPyON: true, version: matches[1], command: matches[2], obj, error: false };
            }
            catch (error) {
                this.log.error(`[${this.connectionId}] parse error:\n${error}`);
                this.log.error(PyONString);
                return { isPyON: true, version: matches[1], command: matches[2], error: true };
            }
        }
    }
    onData(data) {
        const msg = data.toString();
        // this.log.debug(`[${this.connectionId}] data:\n${msg}`);
        let match = null;
        const regexp = /PyON \d+ \w+\n[\s\S]+?\n---/g;
        while ((match = regexp.exec(msg)) !== null) {
            const command = this.parsePyON(match[0]);
            if (command.isPyON) {
                if (command.error) {
                    this.emit("dataError", this.connectionId, command);
                }
                else {
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
exports.default = FahConnection;
