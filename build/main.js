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
        this.log.info("[main] config host: " + this.config.foldingathome__host);
        this.log.info("[main] config port: " + this.config.foldingathome__port);
        this.log.info("[main] config password: " + this.config.foldingathome__password);
        try {
            // TODO: multiple connections
            const fahConnection = new FahConnection_1.default(this.log, this.config.foldingathome__host, this.config.foldingathome__port, this.config.foldingathome__password, this.config.foldingathome__reconnect_delay);
            this.fahConnections.push(fahConnection);
            for (const connection of this.fahConnections) {
                this.log.debug(`[main] creating connection ${connection.connectionId}`);
                this.createConnectionStates(connection);
                // connection.on("optionsUpdate", this.writeOptionStates);
                // connection.on("queueUpdate", this.writeQueueStates);
                // connection.on("slotsUpdate", this.writeSlotStates);
                connection.on("data", this.onConnectionDataUpdate);
                connection.on("connectionUpdate", this.writeConnectionState);
                // connection.on("aliveUpdate", this.writeAliveState);
                connection.connect();
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
        this.writeOptionStates(connection, newData.options, oldData.options);
        this.writeSlotStates(connection, newData, oldData);
        this.writeAliveState(connection, newData.alive);
        this.setState(`${connection.connectionId}.json`, JSON.stringify(newData), true);
    }
    writeAliveState(connection, newAlive) {
        // set alive state to expire after 30 seconds
        this.setState(`${connection.connectionId}.alive`, { val: newAlive, expire: 30 }, true);
        // wait until new data has been applied to connection objects
        setImmediate(() => {
            // Check if all connections are alive
            let allAlive = true;
            this.fahConnections.forEach((fahc) => {
                allAlive = allAlive && fahc.fah.alive;
            });
            // set adapter connection state to true if all connections are alive
            this.setState("info.connection", { val: allAlive, expire: 30 }, true);
        });
    }
    writeOptionStates(connection, newOptions, oldOptions = null) {
        const optionsCh = `${connection.connectionId}.options`;
        this.setObjectNotExists(`${optionsCh}.user`, {
            type: "state",
            common: {
                name: "user",
                type: "string",
                role: "state",
                read: true,
                write: false,
            },
            native: {},
        });
        if (newOptions.user !== (oldOptions === null || oldOptions === void 0 ? void 0 : oldOptions.user)) {
            this.setState(`${optionsCh}.user`, newOptions.user, true);
        }
        this.setObjectNotExists(`${optionsCh}.team`, {
            type: "state",
            common: {
                name: "team",
                type: "string",
                role: "state",
                read: true,
                write: false,
            },
            native: {},
        });
        if (newOptions.team !== (oldOptions === null || oldOptions === void 0 ? void 0 : oldOptions.team)) {
            this.setState(`${optionsCh}.team`, newOptions.team, true);
        }
        this.setObjectNotExists(`${optionsCh}.cause`, {
            type: "state",
            common: {
                name: "cause",
                type: "string",
                role: "state",
                read: true,
                write: false,
            },
            native: {},
        });
        if (newOptions.cause !== (oldOptions === null || oldOptions === void 0 ? void 0 : oldOptions.cause)) {
            this.setState(`${optionsCh}.cause`, newOptions.cause, true);
        }
        this.setObjectNotExists(`${optionsCh}.power`, {
            type: "state",
            common: {
                name: "power",
                type: "string",
                role: "state",
                read: true,
                write: false,
            },
            native: {},
        });
        if (newOptions.power !== (oldOptions === null || oldOptions === void 0 ? void 0 : oldOptions.power)) {
            this.setState(`${optionsCh}.power`, newOptions.power, true);
        }
    }
    writeSlotStates(connection, newData, oldData = null) {
        var _a;
        // get new slots and corresponding old slots
        // write new slots
        // old new slots and corresponding new slots
        // delete old slots without new slots
        const slots = {};
        newData.slots.forEach((slot, index) => {
            slots[slot.id] = { isNew: true, newIndex: index, isOld: false, oldIndex: -1 };
        });
        oldData === null || oldData === void 0 ? void 0 : oldData.slots.forEach((slot, index) => {
            if (slots[slot.id] === undefined) {
                slots[slot.id] = { isNew: false, newIndex: -1, isOld: true, oldIndex: index };
            }
            else {
                slots[slot.id].isOld = true;
                slots[slot.id].oldIndex = index;
            }
        });
        for (const id in slots) {
            const slot = slots[id];
            const slotCh = `${connection.connectionId}.slots.${id}`;
            if (slot.isOld && !slot.isNew) {
                this.deleteChannelAsync(slotCh);
            }
            else {
                const newSlot = newData.slots[slot.newIndex];
                const oldSlot = slot.isOld ? oldData.slots[slot.oldIndex] : null;
                this.setObjectNotExists(slotCh, {
                    type: "channel",
                    common: {
                        name: `slot ${id}`,
                    },
                    native: {},
                });
                this.setObjectNotExists(`${slotCh}.id`, {
                    type: "state",
                    common: {
                        name: "slot id",
                        type: "string",
                        role: "state",
                        read: true,
                        write: false,
                    },
                    native: {},
                });
                if (newSlot.id !== (oldSlot === null || oldSlot === void 0 ? void 0 : oldSlot.id)) {
                    this.setState(`${slotCh}.id`, newSlot.id, true);
                }
                this.setObjectNotExists(`${slotCh}.status`, {
                    type: "state",
                    common: {
                        name: "slot status",
                        type: "string",
                        role: "state",
                        read: true,
                        write: false,
                    },
                    native: {},
                });
                if (newSlot.status !== (oldSlot === null || oldSlot === void 0 ? void 0 : oldSlot.status)) {
                    this.setState(`${slotCh}.status`, newSlot.status, true);
                }
                this.setObjectNotExists(`${slotCh}.description`, {
                    type: "state",
                    common: {
                        name: "slot status",
                        type: "string",
                        role: "state",
                        read: true,
                        write: false,
                    },
                    native: {},
                });
                if (newSlot.description !== (oldSlot === null || oldSlot === void 0 ? void 0 : oldSlot.description)) {
                    this.setState(`${slotCh}.description`, newSlot.description, true);
                }
                this.setObjectNotExists(`${slotCh}.options`, {
                    type: "state",
                    common: {
                        name: "slot options",
                        type: "string",
                        role: "json",
                        read: true,
                        write: false,
                    },
                    native: {},
                });
                if (newSlot.options !== (oldSlot === null || oldSlot === void 0 ? void 0 : oldSlot.options)) {
                    this.setState(`${slotCh}.options`, JSON.stringify(newSlot.options), true);
                }
                const newWU = (_a = newData.queue.find((wu) => wu.slot == id)) !== null && _a !== void 0 ? _a : Foldingathome.emptyWorkUnit;
                const oldWU = slot.isOld ? oldData === null || oldData === void 0 ? void 0 : oldData.queue.find((wu) => wu.slot == id) : null;
                this.setObjectNotExists(`${slotCh}.wu`, {
                    type: "channel",
                    common: {
                        name: `work unit`,
                    },
                    native: {},
                });
                this.writeWorkUnitStates(`${slotCh}.wu`, newWU, oldWU);
            }
        }
    }
    writeWorkUnitStates(wuCh, newWU, oldWU = null) {
        this.setObjectNotExists(`${wuCh}.id`, {
            type: "state",
            common: {
                name: "unit id",
                type: "string",
                role: "state",
                read: true,
                write: false,
            },
            native: {},
        });
        if (newWU.id !== (oldWU === null || oldWU === void 0 ? void 0 : oldWU.id)) {
            this.setState(`${wuCh}.id`, newWU.id, true);
        }
        this.setObjectNotExists(`${wuCh}.state`, {
            type: "state",
            common: {
                name: "state",
                type: "string",
                role: "state",
                read: true,
                write: false,
            },
            native: {},
        });
        if (newWU.state !== (oldWU === null || oldWU === void 0 ? void 0 : oldWU.state)) {
            this.setState(`${wuCh}.state`, newWU.state, true);
        }
        this.setObjectNotExists(`${wuCh}.error`, {
            type: "state",
            common: {
                name: "error",
                type: "string",
                role: "state",
                read: true,
                write: false,
            },
            native: {},
        });
        if (newWU.error !== (oldWU === null || oldWU === void 0 ? void 0 : oldWU.error)) {
            this.setState(`${wuCh}.error`, newWU.error, true);
        }
        this.setObjectNotExists(`${wuCh}.project`, {
            type: "state",
            common: {
                name: "project",
                type: "string",
                role: "state",
                read: true,
                write: false,
            },
            native: {},
        });
        if (newWU.project !== (oldWU === null || oldWU === void 0 ? void 0 : oldWU.project)) {
            this.setState(`${wuCh}.project`, newWU.project, true);
        }
        this.setObjectNotExists(`${wuCh}.run`, {
            type: "state",
            common: {
                name: "run",
                type: "string",
                role: "state",
                read: true,
                write: false,
            },
            native: {},
        });
        if (newWU.run !== (oldWU === null || oldWU === void 0 ? void 0 : oldWU.run)) {
            this.setState(`${wuCh}.run`, newWU.run, true);
        }
        this.setObjectNotExists(`${wuCh}.clone`, {
            type: "state",
            common: {
                name: "clone",
                type: "string",
                role: "state",
                read: true,
                write: false,
            },
            native: {},
        });
        if (newWU.clone !== (oldWU === null || oldWU === void 0 ? void 0 : oldWU.clone)) {
            this.setState(`${wuCh}.clone`, newWU.clone, true);
        }
        this.setObjectNotExists(`${wuCh}.gen`, {
            type: "state",
            common: {
                name: "gen",
                type: "string",
                role: "state",
                read: true,
                write: false,
            },
            native: {},
        });
        if (newWU.gen !== (oldWU === null || oldWU === void 0 ? void 0 : oldWU.gen)) {
            this.setState(`${wuCh}.gen`, newWU.gen, true);
        }
        this.setObjectNotExists(`${wuCh}.core`, {
            type: "state",
            common: {
                name: "core",
                type: "string",
                role: "state",
                read: true,
                write: false,
            },
            native: {},
        });
        if (newWU.core !== (oldWU === null || oldWU === void 0 ? void 0 : oldWU.core)) {
            this.setState(`${wuCh}.core`, newWU.core, true);
        }
        this.setObjectNotExists(`${wuCh}.unit`, {
            type: "state",
            common: {
                name: "unit",
                type: "string",
                role: "state",
                read: true,
                write: false,
            },
            native: {},
        });
        if (newWU.unit !== (oldWU === null || oldWU === void 0 ? void 0 : oldWU.unit)) {
            this.setState(`${wuCh}.unit`, newWU.unit, true);
        }
        // TODO: convert to number
        this.setObjectNotExists(`${wuCh}.percentdone`, {
            type: "state",
            common: {
                name: "percent done",
                type: "string",
                role: "state",
                read: true,
                write: false,
            },
            native: {},
        });
        if (newWU.percentdone !== (oldWU === null || oldWU === void 0 ? void 0 : oldWU.percentdone)) {
            this.setState(`${wuCh}.percentdone`, newWU.percentdone, true);
        }
        // TODO: convert to time
        this.setObjectNotExists(`${wuCh}.eta`, {
            type: "state",
            common: {
                name: "eta",
                type: "string",
                role: "state",
                read: true,
                write: false,
            },
            native: {},
        });
        if (newWU.eta !== (oldWU === null || oldWU === void 0 ? void 0 : oldWU.eta)) {
            this.setState(`${wuCh}.eta`, newWU.eta, true);
        }
        this.setObjectNotExists(`${wuCh}.ppd`, {
            type: "state",
            common: {
                name: "points per day",
                type: "string",
                role: "state",
                read: true,
                write: false,
            },
            native: {},
        });
        if (newWU.ppd !== (oldWU === null || oldWU === void 0 ? void 0 : oldWU.ppd)) {
            this.setState(`${wuCh}.ppd`, newWU.ppd, true);
        }
        this.setObjectNotExists(`${wuCh}.creditestimate`, {
            type: "state",
            common: {
                name: "credit estimate",
                type: "string",
                role: "state",
                read: true,
                write: false,
            },
            native: {},
        });
        if (newWU.creditestimate !== (oldWU === null || oldWU === void 0 ? void 0 : oldWU.creditestimate)) {
            this.setState(`${wuCh}.creditestimate`, newWU.creditestimate, true);
        }
        this.setObjectNotExists(`${wuCh}.waitingon`, {
            type: "state",
            common: {
                name: "waiting on",
                type: "string",
                role: "state",
                read: true,
                write: false,
            },
            native: {},
        });
        if (newWU.waitingon !== (oldWU === null || oldWU === void 0 ? void 0 : oldWU.waitingon)) {
            this.setState(`${wuCh}.waitingon`, newWU.waitingon, true);
        }
        this.setObjectNotExists(`${wuCh}.nextattempt`, {
            type: "state",
            common: {
                name: "next attempt",
                type: "string",
                role: "state",
                read: true,
                write: false,
            },
            native: {},
        });
        if (newWU.nextattempt !== (oldWU === null || oldWU === void 0 ? void 0 : oldWU.nextattempt)) {
            this.setState(`${wuCh}.nextattempt`, newWU.nextattempt, true);
        }
        this.setObjectNotExists(`${wuCh}.timeremaining`, {
            type: "state",
            common: {
                name: "time remaining",
                type: "string",
                role: "state",
                read: true,
                write: false,
            },
            native: {},
        });
        if (newWU.timeremaining !== (oldWU === null || oldWU === void 0 ? void 0 : oldWU.timeremaining)) {
            this.setState(`${wuCh}.timeremaining`, newWU.timeremaining, true);
        }
        this.setObjectNotExists(`${wuCh}.totalframes`, {
            type: "state",
            common: {
                name: "total frames",
                type: "string",
                role: "state",
                read: true,
                write: false,
            },
            native: {},
        });
        if (newWU.totalframes !== (oldWU === null || oldWU === void 0 ? void 0 : oldWU.totalframes)) {
            this.setState(`${wuCh}.totalframes`, newWU.totalframes, true);
        }
        this.setObjectNotExists(`${wuCh}.framesdone`, {
            type: "state",
            common: {
                name: "frames done",
                type: "string",
                role: "state",
                read: true,
                write: false,
            },
            native: {},
        });
        if (newWU.framesdone !== (oldWU === null || oldWU === void 0 ? void 0 : oldWU.framesdone)) {
            this.setState(`${wuCh}.framesdone`, newWU.framesdone, true);
        }
        this.setObjectNotExists(`${wuCh}.assigned`, {
            type: "state",
            common: {
                name: "assigned",
                type: "string",
                role: "state",
                read: true,
                write: false,
            },
            native: {},
        });
        if (newWU.assigned !== (oldWU === null || oldWU === void 0 ? void 0 : oldWU.assigned)) {
            this.setState(`${wuCh}.assigned`, newWU.assigned, true);
        }
        this.setObjectNotExists(`${wuCh}.timeout`, {
            type: "state",
            common: {
                name: "timeout",
                type: "string",
                role: "state",
                read: true,
                write: false,
            },
            native: {},
        });
        if (newWU.timeout !== (oldWU === null || oldWU === void 0 ? void 0 : oldWU.timeout)) {
            this.setState(`${wuCh}.timeout`, newWU.timeout, true);
        }
        this.setObjectNotExists(`${wuCh}.deadline`, {
            type: "state",
            common: {
                name: "deadline",
                type: "string",
                role: "state",
                read: true,
                write: false,
            },
            native: {},
        });
        if (newWU.deadline !== (oldWU === null || oldWU === void 0 ? void 0 : oldWU.deadline)) {
            this.setState(`${wuCh}.deadline`, newWU.deadline, true);
        }
        this.setObjectNotExists(`${wuCh}.ws`, {
            type: "state",
            common: {
                name: "work server",
                type: "string",
                role: "state",
                read: true,
                write: false,
            },
            native: {},
        });
        if (newWU.ws !== (oldWU === null || oldWU === void 0 ? void 0 : oldWU.ws)) {
            this.setState(`${wuCh}.ws`, newWU.ws, true);
        }
        this.setObjectNotExists(`${wuCh}.cs`, {
            type: "state",
            common: {
                name: "collection server",
                type: "string",
                role: "state",
                read: true,
                write: false,
            },
            native: {},
        });
        if (newWU.cs !== (oldWU === null || oldWU === void 0 ? void 0 : oldWU.cs)) {
            this.setState(`${wuCh}.cs`, newWU.cs, true);
        }
        this.setObjectNotExists(`${wuCh}.attempts`, {
            type: "state",
            common: {
                name: "attempts",
                type: "string",
                role: "state",
                read: true,
                write: false,
            },
            native: {},
        });
        if (newWU.attempts !== (oldWU === null || oldWU === void 0 ? void 0 : oldWU.attempts)) {
            this.setState(`${wuCh}.attempts`, newWU.attempts, true);
        }
        this.setObjectNotExists(`${wuCh}.slot`, {
            type: "state",
            common: {
                name: "slot",
                type: "string",
                role: "state",
                read: true,
                write: false,
            },
            native: {},
        });
        if (newWU.slot !== (oldWU === null || oldWU === void 0 ? void 0 : oldWU.slot)) {
            this.setState(`${wuCh}.slot`, newWU.slot, true);
        }
        this.setObjectNotExists(`${wuCh}.tpf`, {
            type: "state",
            common: {
                name: "time per frame",
                type: "string",
                role: "state",
                read: true,
                write: false,
            },
            native: {},
        });
        if (newWU.tpf !== (oldWU === null || oldWU === void 0 ? void 0 : oldWU.tpf)) {
            this.setState(`${wuCh}.tpf`, newWU.tpf, true);
        }
        this.setObjectNotExists(`${wuCh}.basecredit`, {
            type: "state",
            common: {
                name: "base credit",
                type: "string",
                role: "state",
                read: true,
                write: false,
            },
            native: {},
        });
        if (newWU.basecredit !== (oldWU === null || oldWU === void 0 ? void 0 : oldWU.basecredit)) {
            this.setState(`${wuCh}.basecredit`, newWU.basecredit, true);
        }
    }
}
Foldingathome.emptyWorkUnit = {
    id: "",
    state: "NO_WU",
    error: "NO_ERROR",
    project: 0,
    run: 0,
    clone: -1,
    gen: -1,
    core: "unknown",
    unit: "0x00000000000000000000000000000000",
    percentdone: "0.00%",
    eta: "0.00 secs",
    ppd: "0",
    creditestimate: "0",
    waitingon: "Unknown",
    nextattempt: "0.00 secs",
    timeremaining: "0.00 secs",
    totalframes: 0,
    framesdone: 0,
    assigned: "<invalid>",
    timeout: "<invalid>",
    deadline: "<invalid>",
    ws: "0.0.0.0",
    cs: "0.0.0.0",
    attempts: -1,
    slot: "<invalid>",
    tpf: "0.00 secs",
    basecredit: "0",
};
if (module.parent) {
    // Export the constructor in compact mode
    module.exports = (options) => new Foldingathome(options);
}
else {
    // otherwise start the instance directly
    (() => new Foldingathome())();
}
