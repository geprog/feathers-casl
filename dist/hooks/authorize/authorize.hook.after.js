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
const feathers_hooks_common_1 = require("feathers-hooks-common");
const ability_1 = require("@casl/ability");
const pick_1 = __importDefault(require("lodash/pick"));
const isEmpty_1 = __importDefault(require("lodash/isEmpty"));
const feathers_utils_1 = require("feathers-utils");
const authorize_hook_utils_1 = require("./authorize.hook.utils");
const hasRestrictingFields_1 = __importDefault(require("../../utils/hasRestrictingFields"));
const getModelName_1 = __importDefault(require("../../utils/getModelName"));
const errors_1 = require("@feathersjs/errors");
const getAvailableFields_1 = __importDefault(require("../../utils/getAvailableFields"));
const HOOKNAME = "authorize";
exports.default = (context, options) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (!(options === null || options === void 0 ? void 0 : options.notSkippable) && ((0, feathers_utils_1.shouldSkip)(HOOKNAME, context) ||
        context.type !== "after" ||
        !context.params)) {
        return context;
    }
    //@ts-expect-error type error because feathers-hooks-common not on feathers@5
    const itemOrItems = (0, feathers_hooks_common_1.getItems)(context);
    if (!itemOrItems) {
        return context;
    }
    options = (0, authorize_hook_utils_1.makeOptions)(context.app, options);
    const modelName = (0, getModelName_1.default)(options.modelName, context);
    if (!modelName) {
        return context;
    }
    const skipCheckConditions = (0, authorize_hook_utils_1.getPersistedConfig)(context, "skipRestrictingRead.conditions");
    const skipCheckFields = (0, authorize_hook_utils_1.getPersistedConfig)(context, "skipRestrictingRead.fields");
    if (skipCheckConditions && skipCheckFields) {
        return context;
    }
    const { params } = context;
    params.ability = yield (0, authorize_hook_utils_1.getAbility)(context, options);
    if (!params.ability) {
        // Ignore internal or not authenticated requests
        return context;
    }
    const { ability } = params;
    const asArray = Array.isArray(itemOrItems);
    let items = (asArray) ? itemOrItems : [itemOrItems];
    const availableFields = (0, getAvailableFields_1.default)(context, options);
    const hasRestrictingFieldsOptions = {
        availableFields: availableFields
    };
    const getOrFind = (asArray) ? "find" : "get";
    const $select = (_a = params.query) === null || _a === void 0 ? void 0 : _a.$select;
    if (context.method !== "remove") {
        const $newSelect = (0, authorize_hook_utils_1.getConditionalSelect)($select, ability, getOrFind, modelName);
        if ($newSelect) {
            const _items = yield (0, authorize_hook_utils_1.refetchItems)(context);
            if (_items) {
                items = _items;
            }
        }
    }
    const pickFieldsForItem = (item) => {
        const method = (Array.isArray(itemOrItems)) ? "find" : "get";
        if (!skipCheckConditions && !ability.can(method, (0, ability_1.subject)(modelName, item))) {
            return undefined;
        }
        let fields = (0, hasRestrictingFields_1.default)(ability, method, (0, ability_1.subject)(modelName, item), hasRestrictingFieldsOptions);
        if (fields === true) {
            // full restriction
            return {};
        }
        else if (skipCheckFields || (!fields && !$select)) {
            // no restrictions
            return item;
        }
        else if (fields && $select) {
            fields = (0, feathers_utils_1.mergeArrays)(fields, $select, "intersect");
        }
        else {
            fields = (fields) ? fields : $select;
        }
        return (0, pick_1.default)(item, fields);
    };
    let result;
    if (asArray) {
        result = [];
        for (let i = 0, n = items.length; i < n; i++) {
            const item = pickFieldsForItem(items[i]);
            if (item) {
                result.push(item);
            }
        }
    }
    else {
        result = pickFieldsForItem(items[0]);
        if (context.method === "get" && (0, isEmpty_1.default)(result)) {
            if (options.actionOnForbidden)
                options.actionOnForbidden();
            throw new errors_1.Forbidden(`You're not allowed to ${context.method} ${modelName}`);
        }
    }
    //@ts-expect-error type error because feathers-hooks-common not on feathers@5
    (0, feathers_hooks_common_1.replaceItems)(context, result);
    return context;
});
