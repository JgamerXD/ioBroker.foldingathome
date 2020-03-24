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
        this.writeOptionStates = this.writeOptionStates.bind(this);
        this.writeQueueStates = this.writeQueueStates.bind(this);
        this.writeSlotStates = this.writeSlotStates.bind(this);
        this.writeConnectionState = this.writeConnectionState.bind(this);
        this.writeAliveState = this.writeAliveState.bind(this);
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
        this.log.info("config reconnect_timeout: " + this.config.foldingathome__reconnect_delay);
        this.log.info("config host: " + this.config.foldingathome__host);
        this.log.info("config port: " + this.config.foldingathome__port);
        this.log.info("config password: " + this.config.foldingathome__password);
        try {
            // TODO: multiple connections
            const fahConnection = new FahConnection_1.default(this.log, this.config.foldingathome__host, this.config.foldingathome__port, this.config.foldingathome__password, this.config.foldingathome__reconnect_delay);
            this.fahConnections.push(fahConnection);
            for (const connection of this.fahConnections) {
                this.log.debug(`[main] creating connection ${connection.connectionId}`);
                this.createConnectionStates(connection);
                connection.on("optionsUpdate", this.writeOptionStates);
                connection.on("queueUpdate", this.writeQueueStates);
                connection.on("slotsUpdate", this.writeSlotStates);
                connection.on("connectionUpdate", this.writeConnectionState);
                connection.on("aliveUpdate", this.writeAliveState);
                connection.connect();
            }
        }
        catch (error) {
            this.log.error(error);
        }
    }
    /**
     * Is called when adapter shuts down - callback has to be called under any circumstances!
     */
    onUnload(callback) {
        try {
            Promise.all(this.fahConnections.map((fc) => fc.closeConnection())).catch(this.log.error);
            this.log.info("cleaned everything up...");
            callback();
        }
        catch (e) {
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
        this.setObjectNotExists(`${connection.connectionId}.queue`, {
            type: "channel",
            common: {
                name: `queue`,
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
    writeAliveState(connection, alive) {
        if (alive !== connection.fah.alive) {
            this.setState(`${connection.connectionId}.alive`, alive, true);
        }
        setImmediate(() => {
            // Check if all connections are alive
            let allAlive = true;
            this.fahConnections.forEach((fahc) => {
                allAlive = allAlive && fahc.fah.alive;
            });
            this.setState("info.connection", allAlive, true);
        });
    }
    writeOptionStates(connection, options) {
        const optionsCh = `${connection.connectionId}.options`;
        const oldOptions = connection.fah.options;
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
        if (options.user &&
            (oldOptions === undefined || oldOptions.user === undefined || oldOptions.user !== options.user)) {
            this.setState(`${optionsCh}.user`, options.user, true);
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
        if (options.team &&
            (oldOptions === undefined || oldOptions.team === undefined || oldOptions.team !== options.team)) {
            this.setState(`${optionsCh}.team`, options.team, true);
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
        if (options.cause &&
            (oldOptions === undefined || oldOptions.cause === undefined || oldOptions.cause !== options.cause)) {
            this.setState(`${optionsCh}.cause`, options.cause, true);
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
        if (options.power &&
            (oldOptions === undefined || oldOptions.power === undefined || oldOptions.power !== options.power)) {
            this.setState(`${optionsCh}.power`, options.power, true);
        }
    }
    writeSlotStates(connection, slots) {
        slots.forEach((slot, index) => {
            const oldSlot = connection.fah.slots[index];
            const slotCh = `${connection.connectionId}.slots.${slot.id}`;
            this.setObjectNotExists(slotCh, {
                type: "channel",
                common: {
                    name: `slot ${slot.id}`,
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
            if (slot.id && (oldSlot === undefined || oldSlot.id === undefined || oldSlot.id !== slot.id)) {
                this.setState(`${slotCh}.id`, slot.id, true);
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
            if (slot.status &&
                (oldSlot === undefined || oldSlot.status === undefined || oldSlot.status !== slot.status)) {
                this.setState(`${slotCh}.status`, slot.status, true);
            }
            this.setState(`${slotCh}.status`, slot.status, true);
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
            if (slot.description &&
                (oldSlot === undefined || oldSlot.description === undefined || oldSlot.description !== slot.description)) {
                this.setState(`${slotCh}.description`, slot.description, true);
            }
            this.setObjectNotExists(`${slotCh}.options`, {
                type: "channel",
                common: {
                    name: "slot options",
                    type: "string",
                    role: "state",
                    read: true,
                    write: false,
                },
                native: {},
            });
            this.setObjectNotExists(`${slotCh}.options.paused`, {
                type: "state",
                common: {
                    name: "slot paused",
                    type: "bool",
                    role: "indicator",
                    read: true,
                    write: false,
                },
                native: {},
            });
            if (slot.options &&
                slot.options.paused &&
                (oldSlot === undefined ||
                    oldSlot.options === undefined ||
                    oldSlot.options.paused === undefined ||
                    oldSlot.options.paused !== slot.options.paused)) {
                this.setState(`${slotCh}.options.paused`, slot.options.paused, true);
            }
            this.setObjectNotExists(`${slotCh}.options.idle`, {
                type: "state",
                common: {
                    name: "slot idle",
                    type: "bool",
                    role: "indicator",
                    read: true,
                    write: false,
                },
                native: {},
            });
            if (slot.options &&
                slot.options.idle &&
                (oldSlot === undefined ||
                    oldSlot.options === undefined ||
                    oldSlot.options.idle === undefined ||
                    oldSlot.options.idle !== slot.options.idle)) {
                this.setState(`${slotCh}.options.idle`, slot.options.idle, true);
            }
        });
    }
    writeQueueStates(connection, queue) {
        queue.forEach((unit, index) => {
            const oldUnit = connection.fah.queue[index];
            const queueCh = `${connection.connectionId}.queue.${unit.id}`;
            this.setObjectNotExists(queueCh, {
                type: "channel",
                common: {
                    name: `unit ${unit.id}`,
                },
                native: {},
            });
            this.setObjectNotExists(`${queueCh}.id`, {
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
            if (unit.id && (oldUnit === undefined || oldUnit.id === undefined || oldUnit.id !== unit.id)) {
                this.setState(`${queueCh}.id`, unit.id, true);
            }
            this.setObjectNotExists(`${queueCh}.state`, {
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
            if (unit.state && (oldUnit === undefined || oldUnit.state === undefined || oldUnit.state !== unit.state)) {
                this.setState(`${queueCh}.state`, unit.state, true);
            }
            this.setObjectNotExists(`${queueCh}.error`, {
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
            if (unit.error && (oldUnit === undefined || oldUnit.error === undefined || oldUnit.error !== unit.error)) {
                this.setState(`${queueCh}.error`, unit.error, true);
            }
            this.setObjectNotExists(`${queueCh}.project`, {
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
            if (unit.project &&
                (oldUnit === undefined || oldUnit.project === undefined || oldUnit.project !== unit.project)) {
                this.setState(`${queueCh}.project`, unit.project, true);
            }
            this.setObjectNotExists(`${queueCh}.run`, {
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
            if (unit.run && (oldUnit === undefined || oldUnit.run === undefined || oldUnit.run !== unit.run)) {
                this.setState(`${queueCh}.run`, unit.run, true);
            }
            this.setObjectNotExists(`${queueCh}.clone`, {
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
            if (unit.clone && (oldUnit === undefined || oldUnit.clone === undefined || oldUnit.clone !== unit.clone)) {
                this.setState(`${queueCh}.clone`, unit.clone, true);
            }
            this.setObjectNotExists(`${queueCh}.gen`, {
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
            if (unit.gen && (oldUnit === undefined || oldUnit.gen === undefined || oldUnit.gen !== unit.gen)) {
                this.setState(`${queueCh}.gen`, unit.gen, true);
            }
            this.setObjectNotExists(`${queueCh}.core`, {
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
            if (unit.core && (oldUnit === undefined || oldUnit.core === undefined || oldUnit.core !== unit.core)) {
                this.setState(`${queueCh}.core`, unit.core, true);
            }
            this.setObjectNotExists(`${queueCh}.unit`, {
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
            if (unit.unit && (oldUnit === undefined || oldUnit.unit === undefined || oldUnit.unit !== unit.unit)) {
                this.setState(`${queueCh}.unit`, unit.unit, true);
            }
            // TODO: convert to number
            this.setObjectNotExists(`${queueCh}.percentdone`, {
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
            if (unit.percentdone &&
                (oldUnit === undefined || oldUnit.percentdone === undefined || oldUnit.percentdone !== unit.percentdone)) {
                this.setState(`${queueCh}.percentdone`, unit.percentdone, true);
            }
            // TODO: convert to time
            this.setObjectNotExists(`${queueCh}.eta`, {
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
            if (unit.eta && (oldUnit === undefined || oldUnit.eta === undefined || oldUnit.eta !== unit.eta)) {
                this.setState(`${queueCh}.eta`, unit.eta, true);
            }
            this.setObjectNotExists(`${queueCh}.ppd`, {
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
            if (unit.ppd && (oldUnit === undefined || oldUnit.ppd === undefined || oldUnit.ppd !== unit.ppd)) {
                this.setState(`${queueCh}.ppd`, unit.ppd, true);
            }
            this.setObjectNotExists(`${queueCh}.creditestimate`, {
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
            if (unit.creditestimate &&
                (oldUnit === undefined ||
                    oldUnit.creditestimate === undefined ||
                    oldUnit.creditestimate !== unit.creditestimate)) {
                this.setState(`${queueCh}.creditestimate`, unit.creditestimate, true);
            }
            this.setObjectNotExists(`${queueCh}.waitingon`, {
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
            if (unit.waitingon &&
                (oldUnit === undefined || oldUnit.waitingon === undefined || oldUnit.waitingon !== unit.waitingon)) {
                this.setState(`${queueCh}.waitingon`, unit.waitingon, true);
            }
            this.setObjectNotExists(`${queueCh}.nextattempt`, {
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
            if (unit.nextattempt &&
                (oldUnit === undefined || oldUnit.nextattempt === undefined || oldUnit.nextattempt !== unit.nextattempt)) {
                this.setState(`${queueCh}.nextattempt`, unit.nextattempt, true);
            }
            this.setObjectNotExists(`${queueCh}.timeremaining`, {
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
            if (unit.timeremaining &&
                (oldUnit === undefined ||
                    oldUnit.timeremaining === undefined ||
                    oldUnit.timeremaining !== unit.timeremaining)) {
                this.setState(`${queueCh}.timeremaining`, unit.timeremaining, true);
            }
            this.setObjectNotExists(`${queueCh}.totalframes`, {
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
            if (unit.totalframes &&
                (oldUnit === undefined || oldUnit.totalframes === undefined || oldUnit.totalframes !== unit.totalframes)) {
                this.setState(`${queueCh}.totalframes`, unit.totalframes, true);
            }
            this.setObjectNotExists(`${queueCh}.framesdone`, {
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
            if (unit.framesdone &&
                (oldUnit === undefined || oldUnit.framesdone === undefined || oldUnit.framesdone !== unit.framesdone)) {
                this.setState(`${queueCh}.framesdone`, unit.framesdone, true);
            }
            this.setObjectNotExists(`${queueCh}.assigned`, {
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
            if (unit.assigned &&
                (oldUnit === undefined || oldUnit.assigned === undefined || oldUnit.assigned !== unit.assigned)) {
                this.setState(`${queueCh}.assigned`, unit.assigned, true);
            }
            this.setObjectNotExists(`${queueCh}.timeout`, {
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
            if (unit.timeout &&
                (oldUnit === undefined || oldUnit.timeout === undefined || oldUnit.timeout !== unit.timeout)) {
                this.setState(`${queueCh}.timeout`, unit.timeout, true);
            }
            this.setObjectNotExists(`${queueCh}.deadline`, {
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
            if (unit.deadline &&
                (oldUnit === undefined || oldUnit.deadline === undefined || oldUnit.deadline !== unit.deadline)) {
                this.setState(`${queueCh}.deadline`, unit.deadline, true);
            }
            this.setObjectNotExists(`${queueCh}.ws`, {
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
            if (unit.ws && (oldUnit === undefined || oldUnit.ws === undefined || oldUnit.ws !== unit.ws)) {
                this.setState(`${queueCh}.ws`, unit.ws, true);
            }
            this.setObjectNotExists(`${queueCh}.cs`, {
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
            if (unit.cs && (oldUnit === undefined || oldUnit.cs === undefined || oldUnit.cs !== unit.cs)) {
                this.setState(`${queueCh}.cs`, unit.cs, true);
            }
            this.setObjectNotExists(`${queueCh}.attempts`, {
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
            if (unit.attempts &&
                (oldUnit === undefined || oldUnit.attempts === undefined || oldUnit.attempts !== unit.attempts)) {
                this.setState(`${queueCh}.attempts`, unit.attempts, true);
            }
            this.setObjectNotExists(`${queueCh}.slot`, {
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
            if (unit.slot && (oldUnit === undefined || oldUnit.slot === undefined || oldUnit.slot !== unit.slot)) {
                this.setState(`${queueCh}.slot`, unit.slot, true);
            }
            this.setObjectNotExists(`${queueCh}.tpf`, {
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
            if (unit.tpf && (oldUnit === undefined || oldUnit.tpf === undefined || oldUnit.tpf !== unit.tpf)) {
                this.setState(`${queueCh}.tpf`, unit.tpf, true);
            }
            this.setObjectNotExists(`${queueCh}.basecredit`, {
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
            if (unit.basecredit &&
                (oldUnit === undefined || oldUnit.basecredit === undefined || oldUnit.basecredit !== unit.basecredit)) {
                this.setState(`${queueCh}.basecredit`, unit.basecredit, true);
            }
        });
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
