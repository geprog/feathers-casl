"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.utils = exports.mergeQueryFromAbility = exports.checkCan = exports.defineAbility = exports.createAliasResolver = exports.AbilityBuilder = exports.Ability = exports.makeAbilityFromRules = exports.getChannelsWithReadAbility = exports.channels = exports.checkBasicPermission = exports.authorize = exports.hooks = void 0;
const hooks = __importStar(require("./hooks"));
exports.hooks = hooks;
const channels = __importStar(require("./channels"));
exports.channels = channels;
// utils
const checkCan_1 = __importDefault(require("./utils/checkCan"));
exports.checkCan = checkCan_1.default;
const checkBasicPermission_1 = __importDefault(require("./utils/checkBasicPermission"));
const hasRestrictingConditions_1 = __importDefault(require("./utils/hasRestrictingConditions"));
const hasRestrictingFields_1 = __importDefault(require("./utils/hasRestrictingFields"));
const mergeQueryFromAbility_1 = __importDefault(require("./utils/mergeQueryFromAbility"));
exports.mergeQueryFromAbility = mergeQueryFromAbility_1.default;
const initialize_1 = __importDefault(require("./initialize"));
exports.default = initialize_1.default;
var hooks_1 = require("./hooks");
Object.defineProperty(exports, "authorize", { enumerable: true, get: function () { return hooks_1.authorize; } });
Object.defineProperty(exports, "checkBasicPermission", { enumerable: true, get: function () { return hooks_1.checkBasicPermission; } });
var channels_1 = require("./channels");
Object.defineProperty(exports, "getChannelsWithReadAbility", { enumerable: true, get: function () { return channels_1.getChannelsWithReadAbility; } });
var makeAbilityFromRules_1 = require("./makeAbilityFromRules");
Object.defineProperty(exports, "makeAbilityFromRules", { enumerable: true, get: function () { return __importDefault(makeAbilityFromRules_1).default; } });
var ability_1 = require("@casl/ability");
Object.defineProperty(exports, "Ability", { enumerable: true, get: function () { return ability_1.Ability; } });
Object.defineProperty(exports, "AbilityBuilder", { enumerable: true, get: function () { return ability_1.AbilityBuilder; } });
Object.defineProperty(exports, "createAliasResolver", { enumerable: true, get: function () { return ability_1.createAliasResolver; } });
Object.defineProperty(exports, "defineAbility", { enumerable: true, get: function () { return ability_1.defineAbility; } });
exports.utils = {
    checkCan: checkCan_1.default,
    checkBasicPermission: checkBasicPermission_1.default,
    hasRestrictingConditions: hasRestrictingConditions_1.default,
    hasRestrictingFields: hasRestrictingFields_1.default,
    mergeQueryFromAbility: mergeQueryFromAbility_1.default
};
__exportStar(require("./types"), exports);
if (typeof module !== "undefined") {
    module.exports = Object.assign(initialize_1.default, module.exports);
}
