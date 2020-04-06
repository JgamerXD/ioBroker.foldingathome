"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const FahConnection_1 = __importDefault(require("./FahConnection"));
function writeAliveState(adapter, allConnections, connection, newAlive) {
    // set alive state to expire after 30 seconds
    adapter.setState(`${connection.connectionId}.alive`, { val: newAlive, expire: 30 }, true);
    // wait until new data has been applied to connection objects
    setImmediate(() => {
        // Check if all connections are alive
        let allAlive = true;
        allConnections.forEach((fahc) => {
            allAlive = allAlive && fahc.fah.alive;
        });
        // set adapter connection state to true if all connections are alive
        adapter.setState("info.connection", { val: allAlive, expire: 30 }, true);
    });
}
exports.writeAliveState = writeAliveState;
function writeOptionStates(adapter, connection, newOptions, oldOptions = null) {
    const optionsCh = `${connection.connectionId}.options`;
    adapter.setObjectNotExists(`${optionsCh}.user`, {
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
        adapter.setState(`${optionsCh}.user`, newOptions.user, true);
    }
    adapter.setObjectNotExists(`${optionsCh}.team`, {
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
        adapter.setState(`${optionsCh}.team`, newOptions.team, true);
    }
    adapter.setObjectNotExists(`${optionsCh}.cause`, {
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
        adapter.setState(`${optionsCh}.cause`, newOptions.cause, true);
    }
    adapter.setObjectNotExists(`${optionsCh}.power`, {
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
        adapter.setState(`${optionsCh}.power`, newOptions.power, true);
    }
}
exports.writeOptionStates = writeOptionStates;
function writeSlotStates(adapter, connection, newData, oldData = null) {
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
            adapter.deleteChannelAsync(slotCh);
        }
        else {
            const newSlot = newData.slots[slot.newIndex];
            const oldSlot = slot.isOld ? oldData.slots[slot.oldIndex] : null;
            adapter.setObjectNotExists(slotCh, {
                type: "channel",
                common: {
                    name: `slot ${id}`,
                },
                native: {},
            });
            adapter.setObjectNotExists(`${slotCh}.id`, {
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
                adapter.setState(`${slotCh}.id`, newSlot.id, true);
            }
            adapter.setObjectNotExists(`${slotCh}.status`, {
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
                adapter.setState(`${slotCh}.status`, newSlot.status, true);
            }
            adapter.setObjectNotExists(`${slotCh}.description`, {
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
                adapter.setState(`${slotCh}.description`, newSlot.description, true);
            }
            adapter.setObjectNotExists(`${slotCh}.options`, {
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
                adapter.setState(`${slotCh}.options`, JSON.stringify(newSlot.options), true);
            }
            const newWU = (_a = newData.queue.find((wu) => wu.slot == id)) !== null && _a !== void 0 ? _a : FahConnection_1.default.emptyWorkUnit;
            const oldWU = slot.isOld ? oldData === null || oldData === void 0 ? void 0 : oldData.queue.find((wu) => wu.slot == id) : null;
            adapter.setObjectNotExists(`${slotCh}.wu`, {
                type: "channel",
                common: {
                    name: `work unit`,
                },
                native: {},
            });
            writeWorkUnitStates(adapter, `${slotCh}.wu`, newWU, oldWU);
        }
    }
}
exports.writeSlotStates = writeSlotStates;
function writeWorkUnitStates(adapter, wuCh, newWU, oldWU = null) {
    adapter.setObjectNotExists(`${wuCh}.id`, {
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
        adapter.setState(`${wuCh}.id`, newWU.id, true);
    }
    adapter.setObjectNotExists(`${wuCh}.state`, {
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
        adapter.setState(`${wuCh}.state`, newWU.state, true);
    }
    adapter.setObjectNotExists(`${wuCh}.error`, {
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
        adapter.setState(`${wuCh}.error`, newWU.error, true);
    }
    adapter.setObjectNotExists(`${wuCh}.project`, {
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
        adapter.setState(`${wuCh}.project`, newWU.project, true);
    }
    adapter.setObjectNotExists(`${wuCh}.run`, {
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
        adapter.setState(`${wuCh}.run`, newWU.run, true);
    }
    adapter.setObjectNotExists(`${wuCh}.clone`, {
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
        adapter.setState(`${wuCh}.clone`, newWU.clone, true);
    }
    adapter.setObjectNotExists(`${wuCh}.gen`, {
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
        adapter.setState(`${wuCh}.gen`, newWU.gen, true);
    }
    adapter.setObjectNotExists(`${wuCh}.core`, {
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
        adapter.setState(`${wuCh}.core`, newWU.core, true);
    }
    adapter.setObjectNotExists(`${wuCh}.unit`, {
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
        adapter.setState(`${wuCh}.unit`, newWU.unit, true);
    }
    // TODO: convert to number
    adapter.setObjectNotExists(`${wuCh}.percentdone`, {
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
        adapter.setState(`${wuCh}.percentdone`, newWU.percentdone, true);
    }
    // TODO: convert to time
    adapter.setObjectNotExists(`${wuCh}.eta`, {
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
        adapter.setState(`${wuCh}.eta`, newWU.eta, true);
    }
    adapter.setObjectNotExists(`${wuCh}.ppd`, {
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
        adapter.setState(`${wuCh}.ppd`, newWU.ppd, true);
    }
    adapter.setObjectNotExists(`${wuCh}.creditestimate`, {
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
        adapter.setState(`${wuCh}.creditestimate`, newWU.creditestimate, true);
    }
    adapter.setObjectNotExists(`${wuCh}.waitingon`, {
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
        adapter.setState(`${wuCh}.waitingon`, newWU.waitingon, true);
    }
    adapter.setObjectNotExists(`${wuCh}.nextattempt`, {
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
        adapter.setState(`${wuCh}.nextattempt`, newWU.nextattempt, true);
    }
    adapter.setObjectNotExists(`${wuCh}.timeremaining`, {
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
        adapter.setState(`${wuCh}.timeremaining`, newWU.timeremaining, true);
    }
    adapter.setObjectNotExists(`${wuCh}.totalframes`, {
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
        adapter.setState(`${wuCh}.totalframes`, newWU.totalframes, true);
    }
    adapter.setObjectNotExists(`${wuCh}.framesdone`, {
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
        adapter.setState(`${wuCh}.framesdone`, newWU.framesdone, true);
    }
    adapter.setObjectNotExists(`${wuCh}.assigned`, {
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
        adapter.setState(`${wuCh}.assigned`, newWU.assigned, true);
    }
    adapter.setObjectNotExists(`${wuCh}.timeout`, {
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
        adapter.setState(`${wuCh}.timeout`, newWU.timeout, true);
    }
    adapter.setObjectNotExists(`${wuCh}.deadline`, {
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
        adapter.setState(`${wuCh}.deadline`, newWU.deadline, true);
    }
    adapter.setObjectNotExists(`${wuCh}.ws`, {
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
        adapter.setState(`${wuCh}.ws`, newWU.ws, true);
    }
    adapter.setObjectNotExists(`${wuCh}.cs`, {
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
        adapter.setState(`${wuCh}.cs`, newWU.cs, true);
    }
    adapter.setObjectNotExists(`${wuCh}.attempts`, {
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
        adapter.setState(`${wuCh}.attempts`, newWU.attempts, true);
    }
    adapter.setObjectNotExists(`${wuCh}.slot`, {
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
        adapter.setState(`${wuCh}.slot`, newWU.slot, true);
    }
    adapter.setObjectNotExists(`${wuCh}.tpf`, {
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
        adapter.setState(`${wuCh}.tpf`, newWU.tpf, true);
    }
    adapter.setObjectNotExists(`${wuCh}.basecredit`, {
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
        adapter.setState(`${wuCh}.basecredit`, newWU.basecredit, true);
    }
}
exports.writeWorkUnitStates = writeWorkUnitStates;
