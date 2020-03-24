"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const FahConnection_1 = __importDefault(require("./FahConnection"));
const dummy = {
    log: { ...console },
};
const fah = new FahConnection_1.default(dummy, "localhost", 36330, "");
console.log(fah.connectionId);
