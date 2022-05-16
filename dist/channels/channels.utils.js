"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEventName = exports.getAbility = exports.makeDefaultOptions = exports.makeOptions = void 0;
const getAvailableFields_1 = __importDefault(require("../utils/getAvailableFields"));
const getDefaultModelName_1 = require("../utils/getDefaultModelName");
const makeOptions = (app, options) => {
    options = options || {};
    return Object.assign({}, defaultOptions, getAppOptions(app), options);
};
exports.makeOptions = makeOptions;
const defaultOptions = {
    activated: true,
    channelOnError: ["authenticated"],
    channels: undefined,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ability: ((app, connection, data, context) => {
        return connection.ability;
    }),
    modelName: getDefaultModelName_1.getContextPath,
    restrictFields: true,
    availableFields: (context) => {
        var _a, _b;
        const availableFields = (_b = (_a = context.service.options) === null || _a === void 0 ? void 0 : _a.casl) === null || _b === void 0 ? void 0 : _b.availableFields;
        return (0, getAvailableFields_1.default)(context, { availableFields });
    },
    useActionName: "get"
};
const makeDefaultOptions = (options) => {
    return Object.assign({}, defaultOptions, options);
};
exports.makeDefaultOptions = makeDefaultOptions;
const getAppOptions = (app) => {
    const caslOptions = app === null || app === void 0 ? void 0 : app.get("casl");
    return (caslOptions && caslOptions.channels)
        ? caslOptions.channels
        : {};
};
const getAbility = (app, data, connection, context, options) => __awaiter(void 0, void 0, void 0, function* () {
    if (options.ability) {
        return (typeof options.ability === "function") ?
            yield options.ability(app, connection, data, context) :
            options.ability;
    }
    else {
        return connection.ability;
    }
});
exports.getAbility = getAbility;
const getEventName = (method) => {
    if (method === "create") {
        return "created";
    }
    else if (method === "update") {
        return "updated";
    }
    else if (method === "patch") {
        return "patched";
    }
    else if (method === "remove") {
        return "removed";
    }
    return undefined;
};
exports.getEventName = getEventName;
