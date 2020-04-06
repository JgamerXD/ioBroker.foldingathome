"use strict";
/*
 * Created with @iobroker/create-adapter v1.23.0
 */
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
const utils = __importStar(require("@iobroker/adapter-core"));
const FahConnection_1 = __importDefault(require("./FahConnection"));
require("./writeStates");
const writeStates_1 = require("./writeStates");
class Foldingathome extends utils.Adapter {
    constructor(options = {}) {
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
    async onReady() {
        // Initialize your adapter here
        // Reset the connection indicator during startup
        this.setState("info.connection", false, true);
        // The adapters config (in the instance object everything under the attribute "native") is accessible via
        // this.config:
        this.log.info("[main] config reconnect_timeout: " + this.config.foldingathome__reconnect_delay);
        this.getForeignObject("system.config", (err, obj) => {
            var _a, _b;
            //noinspection JSUnresolvedVariable
            this.config.clientSecret = this.decrypt((_b = (_a = obj === null || obj === void 0 ? void 0 : obj.native) === null || _a === void 0 ? void 0 : _a.secret) !== null && _b !== void 0 ? _b : "8DYVT0lC1Er5sEVm", this.config.clientSecret);
        });
        try {
            for (const connection of this.config.foldingathome__connections) {
                if (connection.host !== "") {
                    const fahConnection = new FahConnection_1.default(this.log, connection.host, connection.port, connection.password, this.config.foldingathome__reconnect_delay, connection.alias);
                    this.log.debug(`[main] creating connection ${fahConnection.connectionId}`);
                    this.createConnectionStates(fahConnection);
                    // connection.on("optionsUpdate", this.writeOptionStates);
                    // connection.on("queueUpdate", this.writeQueueStates);
                    // connection.on("slotsUpdate", this.writeSlotStates);
                    fahConnection.on("data", this.onConnectionDataUpdate);
                    fahConnection.on("connectionUpdate", this.writeConnectionState);
                    // connection.on("aliveUpdate", this.writeAliveState);
                    this.fahConnections.push(fahConnection);
                    fahConnection.connect();
                }
                else {
                    this.log.warn(`[main] empty hostname in options for connection ${JSON.stringify(connection)}. Will not create a connection!`);
                }
            }
        }
        catch (error) {
            this.log.error(`[main] Error while creating connection: ${error}`);
        }
    }
    /**
     * Is called when adapter shuts down - callback has to be called under any circumstances!
     */
    onUnload(callback) {
        try {
            Promise.all(this.fahConnections.map((fc) => fc.closeConnection())).catch(this.log.error);
            this.log.info("[main] cleaned everything up...");
        }
        catch (e) {
            this.log.error(`[main] Error on unload: ${e}`);
        }
        finally {
            callback();
        }
    }
    decrypt(key, value) {
        let result = "";
        for (let i = 0; i < value.length; ++i) {
            result += String.fromCharCode(key[i % key.length].charCodeAt(0) ^ value.charCodeAt(i));
        }
        return result;
    }
    createConnectionStates(connection) {
        this.setObjectNotExists(`${connection.connectionId}`, {
            type: "device",
            common: {
                name: `Folding@home at ${connection.connectionAddress}`,
            },
            native: {},
        });
        this.setObjectNotExists(`${connection.connectionId}.connection`, {
            type: "state",
            common: {
                name: "connection state",
                type: "string",
                role: "state",
                read: true,
                write: false,
            },
            native: {},
        });
        this.setState(`${connection.connectionId}.connection`, "disconnected", true);
        this.setObjectNotExists(`${connection.connectionId}.json`, {
            type: "state",
            common: {
                name: "raw fah data as json",
                type: "string",
                role: "json",
                read: true,
                write: false,
            },
            native: {},
        });
        this.setState(`${connection.connectionId}.json`, JSON.stringify(connection.fah), true);
        this.setObjectNotExists(`${connection.connectionId}.alive`, {
            type: "state",
            common: {
                name: "connection alive",
                type: "indicator",
                role: "indicator.reachable",
                read: true,
                write: false,
            },
            native: {},
        });
        this.setState(`${connection.connectionId}.alive`, false, true);
        this.setObjectNotExists(`${connection.connectionId}.slots`, {
            type: "channel",
            common: {
                name: `slots`,
            },
            native: {},
        });
        this.setObjectNotExists(`${connection.connectionId}.options`, {
            type: "channel",
            common: {
                name: `options`,
            },
            native: {},
        });
    }
    writeConnectionState(connection, state) {
        this.setState(`${connection.connectionId}.connection`, state, true);
    }
    onConnectionDataUpdate(connection, newData, oldData) {
        var _a;
        writeStates_1.writeOptionStates(this, connection, newData.options, oldData.options);
        writeStates_1.writeSlotStates(this, connection, newData, oldData);
        writeStates_1.writeAliveState(this, this.fahConnections, connection, newData.alive);
        this.setState(`${connection.connectionId}.json`, JSON.stringify(newData), true);
        const table = [];
        for (const fahc of this.fahConnections) {
            if (fahc.fah.alive) {
                for (const wu of fahc.fah.queue) {
                    // find work unit run by slot
                    const slot = fahc.fah.slots.find((slot) => slot.id == wu.slot);
                    table.push({
                        Connection: fahc.connectionId,
                        Id: wu.id,
                        Slot: (_a = slot === null || slot === void 0 ? void 0 : slot.description.split(" ")[0]) !== null && _a !== void 0 ? _a : "?",
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
    module.exports = (options) => new Foldingathome(options);
}
else {
    // otherwise start the instance directly
    (() => new Foldingathome())();
}
