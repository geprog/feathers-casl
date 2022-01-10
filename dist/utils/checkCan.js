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
const ability_1 = require("@casl/ability");
const authorize_hook_utils_1 = require("../hooks/authorize/authorize.hook.utils");
const getFieldsForConditions_1 = __importDefault(require("./getFieldsForConditions"));
const makeOptions = (providedOptions) => {
    const defaultOptions = {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        actionOnForbidden: () => { },
        checkGeneral: true,
        skipThrow: false,
        useConditionalSelect: true
    };
    return Object.assign(defaultOptions, providedOptions || {});
};
const checkCan = (ability, id, method, modelName, service, providedOptions) => __awaiter(void 0, void 0, void 0, function* () {
    const options = makeOptions(providedOptions);
    if (options.checkGeneral) {
        const can = (0, authorize_hook_utils_1.throwUnlessCan)(ability, method, modelName, modelName, options);
        if (!can) {
            return false;
        }
    }
    let params;
    if (options.useConditionalSelect) {
        const $select = (0, getFieldsForConditions_1.default)(ability, method, modelName);
        params = {
            query: { $select }
        };
    }
    //@ts-expect-error _get is not exposed
    const getMethod = (service._get) ? "_get" : "get";
    const item = yield service[getMethod](id, params);
    const can = (0, authorize_hook_utils_1.throwUnlessCan)(ability, method, (0, ability_1.subject)(modelName, item), modelName, options);
    return can;
});
exports.default = checkCan;
