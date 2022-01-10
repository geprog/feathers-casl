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
exports.getPersistedConfig = exports.setPersistedConfig = exports.checkMulti = exports.getConditionalSelect = exports.refetchItems = exports.throwUnlessCan = exports.getAbility = exports.getAdapter = exports.makeDefaultOptions = exports.makeOptions = void 0;
const get_1 = __importDefault(require("lodash/get"));
const set_1 = __importDefault(require("lodash/set"));
const errors_1 = require("@feathersjs/errors");
const getFieldsForConditions_1 = __importDefault(require("../../utils/getFieldsForConditions"));
const common_1 = require("../common");
const getAvailableFields_1 = __importDefault(require("../../utils/getAvailableFields"));
const feathers_hooks_common_1 = require("feathers-hooks-common");
const authorize_hook_1 = require("./authorize.hook");
const feathers_utils_1 = require("feathers-utils");
const makeOptions = (app, options) => {
    options = options || {};
    return Object.assign((0, common_1.makeDefaultBaseOptions)(), defaultOptions, getAppOptions(app), options);
};
exports.makeOptions = makeOptions;
const defaultOptions = {
    adapter: undefined,
    availableFields: (context) => {
        var _a, _b;
        const availableFields = (_b = (_a = context.service.options) === null || _a === void 0 ? void 0 : _a.casl) === null || _b === void 0 ? void 0 : _b.availableFields;
        return (0, getAvailableFields_1.default)(context, { availableFields });
    },
    usePatchData: false,
    useUpdateData: false
};
const makeDefaultOptions = (options) => {
    return Object.assign((0, common_1.makeDefaultBaseOptions)(), defaultOptions, options);
};
exports.makeDefaultOptions = makeDefaultOptions;
const getAppOptions = (app) => {
    const caslOptions = app === null || app === void 0 ? void 0 : app.get("casl");
    return (caslOptions && caslOptions.authorizeHook)
        ? caslOptions.authorizeHook
        : {};
};
const getAdapter = (app, options) => {
    if (options.adapter) {
        return options.adapter;
    }
    const caslAppOptions = app === null || app === void 0 ? void 0 : app.get("casl");
    if (caslAppOptions === null || caslAppOptions === void 0 ? void 0 : caslAppOptions.defaultAdapter) {
        return caslAppOptions.defaultAdapter;
    }
    return "feathers-memory";
};
exports.getAdapter = getAdapter;
const getAbility = (context, options) => {
    var _a, _b;
    // if params.ability is set, return it over options.ability
    if ((_a = context === null || context === void 0 ? void 0 : context.params) === null || _a === void 0 ? void 0 : _a.ability) {
        if (typeof context.params.ability === "function") {
            const ability = context.params.ability(context);
            return Promise.resolve(ability);
        }
        else {
            return Promise.resolve(context.params.ability);
        }
    }
    const persistedAbility = getPersistedConfig(context, "ability");
    if (persistedAbility) {
        if (typeof persistedAbility === "function") {
            const ability = persistedAbility(context);
            return Promise.resolve(ability);
        }
        else {
            return Promise.resolve(persistedAbility);
        }
    }
    if (!options.checkAbilityForInternal && !((_b = context.params) === null || _b === void 0 ? void 0 : _b.provider)) {
        return Promise.resolve(undefined);
    }
    if (options === null || options === void 0 ? void 0 : options.ability) {
        if (typeof options.ability === "function") {
            const ability = options.ability(context);
            return Promise.resolve(ability);
        }
        else {
            return Promise.resolve(options.ability);
        }
    }
    throw new errors_1.Forbidden(`You're not allowed to ${context.method} on '${context.path}'`);
};
exports.getAbility = getAbility;
const throwUnlessCan = (ability, method, resource, modelName, options) => {
    if (ability.cannot(method, resource)) {
        if (options.actionOnForbidden)
            options.actionOnForbidden();
        if (!options.skipThrow) {
            throw new errors_1.Forbidden(`You are not allowed to ${method} ${modelName}`);
        }
        return false;
    }
    return true;
};
exports.throwUnlessCan = throwUnlessCan;
const refetchItems = (context, params) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (context.type !== "after") {
        return;
    }
    //@ts-expect-error type error because feathers-hooks-common not on feathers@5
    const itemOrItems = (0, feathers_hooks_common_1.getItems)(context);
    const items = (!itemOrItems || Array.isArray(itemOrItems)) ? itemOrItems : [itemOrItems];
    if (!items) {
        return;
    }
    const idField = (_a = context.service.options) === null || _a === void 0 ? void 0 : _a.id;
    const ids = items.map(item => item[idField]);
    params = Object.assign({}, params, { paginate: false });
    (0, feathers_utils_1.markHookForSkip)(authorize_hook_1.HOOKNAME, "all", { params });
    delete params.ability;
    const query = Object.assign({}, params.query, { [idField]: { $in: ids } });
    params = Object.assign({}, params, { query });
    return yield context.service.find(params);
});
exports.refetchItems = refetchItems;
const getConditionalSelect = ($select, ability, method, modelName) => {
    if (!($select === null || $select === void 0 ? void 0 : $select.length)) {
        return undefined;
    }
    const fields = (0, getFieldsForConditions_1.default)(ability, method, modelName);
    if (!fields.length) {
        return undefined;
    }
    const fieldsToAdd = fields.filter(field => !$select.includes(field));
    if (!fieldsToAdd.length) {
        return undefined;
    }
    return [...$select, ...fieldsToAdd];
};
exports.getConditionalSelect = getConditionalSelect;
const checkMulti = (context, ability, modelName, options) => {
    const { method } = context;
    const currentIsMulti = (0, feathers_utils_1.isMulti)(context);
    if (!currentIsMulti) {
        return true;
    }
    if ((method === "find" && ability.can(method, modelName)) ||
        (ability.can(`${method}-multi`, modelName))) {
        return true;
    }
    if (options === null || options === void 0 ? void 0 : options.actionOnForbidden)
        options.actionOnForbidden();
    throw new errors_1.Forbidden(`You're not allowed to multi-${method} ${modelName}`);
};
exports.checkMulti = checkMulti;
const setPersistedConfig = (context, key, val) => {
    return (0, set_1.default)(context, `params.casl.${key}`, val);
};
exports.setPersistedConfig = setPersistedConfig;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getPersistedConfig(context, key) {
    return (0, get_1.default)(context, `params.casl.${key}`);
}
exports.getPersistedConfig = getPersistedConfig;
