/*
 * Created with @iobroker/create-adapter v1.23.0
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
import * as utils from "@iobroker/adapter-core";
import FahConnection from "./FahConnection";
import { createConnectionStates, writeAliveState, writeOptionStates, writeSlotStates } from "./writeStates";

// Load your modules here, e.g.:
// import * as fs from "fs";

// Augment the adapter.config object with the actual types
// TODO: delete this in the next version
declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace ioBroker {
        interface AdapterConfig {
            foldingathome__reconnect_delay: number;
            foldingathome__connections: [{ host: string; port: number; password: string; alias: string }];
        }
    }
}

class Foldingathome extends utils.Adapter {
    fahConnections: Array<FahConnection>;

    public constructor(options: Partial<ioBroker.AdapterOptions> = {}) {
        super({
            ...options,
            name: "foldingathome",
        });
        this.on("ready", this.onReady.bind(this));
        // this.on("objectChange", this.onObjectChange.bind(this));
        // this.on("stateChange", this.onStateChange.bind(this));
        // this.on("message", this.onMessage.bind(this));
        this.on("unload", this.onUnload.bind(this));
        this.fahConnections = [];

        this.onConnectionDataUpdate = this.onConnectionDataUpdate.bind(this);
        this.writeConnectionState = this.writeConnectionState.bind(this);
    }

    /**
     * Is called when databases are connected and adapter received configuration.
     */
    private async onReady(): Promise<void> {
        // Initialize your adapter here

        // Reset the connection indicator during startup
        this.setState("info.connection", false, true);

        // The adapters config (in the instance object everything under the attribute "native") is accessible via
        // this.config:
        this.log.info("[main] config reconnect_timeout: " + this.config.foldingathome__reconnect_delay);

        try {
            for (const connection of this.config.foldingathome__connections) {
                if (connection.host !== "") {
                    const fahConnection = new FahConnection(
                        this.log,
                        connection.host,
                        connection.port,
                        connection.password,
                        this.config.foldingathome__reconnect_delay,
                        connection.alias,
                    );
                    this.log.debug(`[main] creating connection ${fahConnection.connectionId}`);
                    createConnectionStates(this, fahConnection);

                    fahConnection.on("data", this.onConnectionDataUpdate);

                    fahConnection.on("connectionUpdate", this.writeConnectionState);

                    this.fahConnections.push(fahConnection);
                    fahConnection.connect();
                } else {
                    this.log.warn(
                        `[main] empty hostname in options for connection ${JSON.stringify(
                            connection,
                        )}. Will not create a connection!`,
                    );
                }
            }
        } catch (error) {
            this.log.error(`[main] Error while creating connection: ${error}`);
        }
    }

    /**
     * Is called when adapter shuts down - callback has to be called under any circumstances!
     */
    private onUnload(callback: () => void): void {
        try {
            Promise.all(this.fahConnections.map((fc) => fc.closeConnection())).catch(this.log.error);

            this.log.info("[main] cleaned everything up...");
        } catch (e) {
            this.log.error(`[main] Error on unload: ${e}`);
        } finally {
            callback();
        }
    }

    writeConnectionState(connection: FahConnection, state: string): void {
        this.setState(`${connection.connectionId}.connection`, state, true);
    }

    onConnectionDataUpdate(connection: FahConnection, newData: FahDataType, oldData: FahDataType): void {
        writeOptionStates(this, connection, newData.options, oldData.options);
        writeSlotStates(this, connection, newData, oldData);
        writeAliveState(this, this.fahConnections, connection, newData.alive);
        this.setState(`${connection.connectionId}.json`, JSON.stringify(newData), true);
        const table: Array<{
            Connection: string;
            Id: string;
            Slot: string;
            Status: string;
            Progress: string;
            ETA: string;
            Project: number;
        }> = [];

        let combinedPPD = 0;
        for (const fahc of this.fahConnections) {
            if (fahc.fah.alive) {
                for (const wu of fahc.fah.queue) {
                    combinedPPD += Number(wu.ppd);

                    // find work unit run by slot
                    const slot = fahc.fah.slots.find((slot) => slot.id == wu.slot);
                    table.push({
                        Connection: fahc.connectionId,
                        Id: wu.id,
                        Slot: slot?.description.split(" ")[0] ?? "?",
                        Status: wu.state,
                        Progress: wu.percentdone,
                        ETA: wu.eta,
                        Project: wu.project,
                    });
                }
            }
        }
        this.setStateChangedAsync("table", JSON.stringify(table), true);
    }
}

if (module.parent) {
    // Export the constructor in compact mode
    module.exports = (options: Partial<ioBroker.AdapterOptions> | undefined) => new Foldingathome(options);
} else {
    // otherwise start the instance directly
    (() => new Foldingathome())();
}
