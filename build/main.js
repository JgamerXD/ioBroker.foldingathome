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
const writestates = __importStar(require("./writeStates"));
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
        try {
            for (const connection of this.config.foldingathome__connections) {
                if (connection.host !== "") {
                    const fahConnection = new FahConnection_1.default(this.log, connection.host, connection.port, connection.password, this.config.foldingathome__reconnect_delay, connection.alias);
                    this.log.debug(`[main] creating connection ${fahConnection.connectionId}`);
                    writestates.createConnectionStates(this, fahConnection);
                    fahConnection.on("data", this.onConnectionDataUpdate);
                    fahConnection.on("connectionUpdate", this.writeConnectionState);
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
    writeConnectionState(connection, state) {
        this.setState(`${connection.connectionId}.connection`, state, true);
    }
    onConnectionDataUpdate(connection, newData, oldData) {
        writestates.writeOptionStates(this, connection, newData.options, oldData.options);
        writestates.writeSlotStates(this, connection, newData, oldData);
        writestates.writeAliveState(this, this.fahConnections, connection, newData.alive);
        writestates.writeOtherStates(this, this.fahConnections);
        this.setState(`${connection.connectionId}.json`, JSON.stringify(newData), true);
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
