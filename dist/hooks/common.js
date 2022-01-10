"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkCreatePerItem = exports.makeDefaultBaseOptions = void 0;
const ability_1 = require("@casl/ability");
const feathers_hooks_common_1 = require("feathers-hooks-common");
const authorize_hook_utils_1 = require("./authorize/authorize.hook.utils");
const defaultOptions = {
    ability: undefined,
    actionOnForbidden: undefined,
    checkMultiActions: false,
    checkAbilityForInternal: false,
    modelName: (context) => {
        return context.path;
    },
    notSkippable: false
};
const makeDefaultBaseOptions = () => {
    return Object.assign({}, defaultOptions);
};
exports.makeDefaultBaseOptions = makeDefaultBaseOptions;
const checkCreatePerItem = (context, ability, modelName, options) => {
    const { method } = context;
    if (method !== "create" || !options.checkCreateForData) {
        return context;
    }
    const checkCreateForData = (typeof options.checkCreateForData === "function")
        ? options.checkCreateForData(context)
        : true;
    if (!checkCreateForData) {
        return context;
    }
    // we have all information we need (maybe we need populated data?)
    //@ts-expect-error type error because feathers-hooks-common not on feathers@5
    let items = (0, feathers_hooks_common_1.getItems)(context);
    items = (Array.isArray(items)) ? items : [items];
    for (let i = 0, n = items.length; i < n; i++) {
        (0, authorize_hook_utils_1.throwUnlessCan)(ability, method, (0, ability_1.subject)(modelName, items[i]), modelName, options);
    }
    return context;
};
exports.checkCreatePerItem = checkCreatePerItem;
