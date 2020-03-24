"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
// import "src/types.d.ts";
var events_1 = require("events");
var telnet_client_1 = require("telnet-client");
var FahConnection = /** @class */ (function (_super) {
    __extends(FahConnection, _super);
    function FahConnection(log, host, port, password) {
        if (password === void 0) { password = ""; }
        var _this = _super.call(this) || this;
        // Bind this to function
        _this.onData = _this.onData.bind(_this);
        _this.log = log;
        _this.telnetClient = new telnet_client_1["default"]();
        _this.connectionParams = {
            host: host,
            port: port,
            shellPrompt: "> ",
            timeout: 15000,
            debug: true,
            irs: "\n"
        };
        _this.password = password;
        _this.connectionAddress = host + ":" + port;
        _this.connectionId = _this.connectionAddress.replace(/\W+/g, "_");
        _this.log.info("[" + _this.connectionId + "] created connection to " + _this.connectionAddress);
        _this.isShuttingDown = false;
        _this.isConnected = false;
        _this.isConnecting = false;
        _this.shellPrompt = "> ";
        _this.fah = {
            alive: false,
            options: { user: "", team: "", cause: "", power: "" },
            slots: [],
            queue: []
        };
        _this.telnetClient.on("timeout", function () {
            _this.log.info("[" + _this.connectionId + "] timeout");
            _this.telnetClient.end();
        });
        _this.telnetClient.on("close", function () {
            if (_this.heartbeatTimeout) {
                clearTimeout(_this.heartbeatTimeout);
            }
            _this.log.info("[" + _this.connectionId + "] closed");
            _this.emit("connectionUpdate", _this, "disconnected");
            _this.isConnected = false;
            if (!_this.isShuttingDown && !_this.reconnectTimeout) {
                try {
                    _this.reconnectTimeout = setTimeout(function () {
                        _this.reconnectTimeout = undefined;
                        _this.log.info("[" + _this.connectionId + "] reconnect...");
                        _this.isConnecting = true;
                        _this.telnetClient.connect(_this.connectionParams);
                    }, 300000);
                }
                catch (error) {
                    _this.log.error(error);
                }
            }
        });
        _this.telnetClient.on("data", _this.onData);
        return _this;
    }
    FahConnection.prototype.connect = function () {
        return __awaiter(this, void 0, void 0, function () {
            var res, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.log.info("[" + this.connectionId + "] connecting...");
                        this.emit("connectionUpdate", this, "connecting");
                        this.isConnecting = true;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 10, , 11]);
                        return [4 /*yield*/, this.telnetClient.connect(this.connectionParams)];
                    case 2:
                        _a.sent();
                        res = "";
                        this.isConnected = true;
                        this.emit("connectionUpdate", this, "connected");
                        this.isConnecting = false;
                        if (!(this.password !== "")) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.telnetClient.exec("auth " + this.password)];
                    case 3:
                        res = _a.sent();
                        this.log.info("[" + this.connectionId + "] auth: " + res);
                        _a.label = 4;
                    case 4: return [4 /*yield*/, this.telnetClient.exec("updates clear\n")];
                    case 5:
                        res = _a.sent();
                        return [4 /*yield*/, this.telnetClient.exec("updates add 0 5 $heartbeat\n")];
                    case 6:
                        res = _a.sent();
                        this.onData(res);
                        return [4 /*yield*/, this.telnetClient.exec("updates add 1 1 $(options user team cause power)\n")];
                    case 7:
                        res = _a.sent();
                        this.onData(res);
                        return [4 /*yield*/, this.telnetClient.exec("updates add 2 5 $queue-info\n")];
                    case 8:
                        res = _a.sent();
                        this.onData(res);
                        return [4 /*yield*/, this.telnetClient.exec("updates add 3 5 $slot-info\n")];
                    case 9:
                        res = _a.sent();
                        this.onData(res);
                        this.log.info("[" + this.connectionId + "] connected");
                        return [3 /*break*/, 11];
                    case 10:
                        error_1 = _a.sent();
                        this.log.error("[" + this.connectionId + "] connection error:\n" + error_1);
                        this.emit("connectionUpdate", this, "error");
                        return [3 /*break*/, 11];
                    case 11: return [2 /*return*/];
                }
            });
        });
    };
    FahConnection.prototype.closeConnection = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                if (this.reconnectTimeout) {
                    clearTimeout(this.reconnectTimeout);
                    this.reconnectTimeout = undefined;
                }
                this.isShuttingDown = true;
                return [2 /*return*/, new Promise(function (resolve) {
                        _this.telnetClient.on("close", function () {
                            _this.emit("connectionUpdate", _this, "disconnected");
                            resolve();
                        });
                        _this.telnetClient.end()["catch"](function (e) {
                            _this.log.error("[" + _this.connectionId + "] disconnect error:\n" + e);
                            _this.telnetClient.destroy();
                            resolve();
                        });
                    })];
            });
        });
    };
    FahConnection.prototype.parsePyON = function (PyONString) {
        var matches = PyONString.match(/PyON (\d+) (\w+)\n([\s\S]+?)\n---/m);
        if (matches === null) {
            return { isPyON: false, error: false };
        }
        else {
            var jsonString = matches[3];
            jsonString = jsonString.replace(/False|"false"/g, "false");
            jsonString = jsonString.replace(/True|"true"/g, "true");
            jsonString = jsonString.replace(/NULL/g, "null");
            jsonString = '{"' + matches[2] + '":' + jsonString + "}";
            try {
                var obj = JSON.parse(jsonString);
                return { isPyON: true, version: matches[1], command: matches[2], obj: obj, error: false };
            }
            catch (error) {
                this.log.error(error);
                this.log.error(PyONString);
                return { isPyON: true, version: matches[1], command: matches[2], error: true };
            }
        }
    };
    FahConnection.prototype.onData = function (data) {
        var _this = this;
        var msg = data.toString();
        // this.log.debug(`[${this.connectionId}] data:\n${msg}`);
        var match = null;
        var regexp = /PyON \d+ \w+\n[\s\S]+?\n---/g;
        while ((match = regexp.exec(msg)) !== null) {
            var command = this.parsePyON(match[0]);
            if (command.isPyON) {
                if (command.error) {
                    this.emit("dataError", this.connectionId, command);
                }
                else {
                    this.log.debug("[" + this.connectionId + "] command:\n" + command.command);
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
                            }
                            if (!this.isShuttingDown) {
                                this.heartbeatTimeout = setTimeout(function () {
                                    _this.emit("aliveUpdate", _this, false);
                                    _this.fah.alive = false;
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
    };
    return FahConnection;
}(events_1.EventEmitter));
exports["default"] = FahConnection;
