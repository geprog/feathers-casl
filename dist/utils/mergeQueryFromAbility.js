"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const extra_1 = require("@casl/ability/extra");
const feathers_utils_1 = require("feathers-utils");
const isEmpty_1 = __importDefault(require("lodash/isEmpty"));
const authorize_hook_utils_1 = require("../hooks/authorize/authorize.hook.utils");
const convertRuleToQuery_1 = __importDefault(require("./convertRuleToQuery"));
const hasRestrictingConditions_1 = __importDefault(require("./hasRestrictingConditions"));
const simplifyQuery_1 = __importDefault(require("./simplifyQuery"));
const adaptersFor$not = [
    "feathers-nedb"
];
const adaptersFor$notAsArray = [
    "feathers-sequelize",
    "feathers-objection"
];
const adaptersFor$nor = [
    "feathers-memory",
    "feathers-mongoose",
    "feathers-mongodb"
];
function mergeQueryFromAbility(app, ability, method, modelName, originalQuery, service, options) {
    var _a;
    if ((0, hasRestrictingConditions_1.default)(ability, method, modelName)) {
        const adapter = (0, authorize_hook_utils_1.getAdapter)(app, options);
        let query;
        if (adaptersFor$not.includes(adapter)) {
            // nedb
            query = (0, extra_1.rulesToQuery)(ability, method, modelName, (rule) => {
                const { conditions } = rule;
                return (rule.inverted) ? { $not: conditions } : conditions;
            });
            query = (0, simplifyQuery_1.default)(query);
        }
        else if (adaptersFor$notAsArray.includes(adapter)) {
            // objection, sequelize
            query = (0, extra_1.rulesToQuery)(ability, method, modelName, (rule) => {
                const { conditions } = rule;
                return (rule.inverted) ? { $not: [conditions] } : conditions;
            });
            query = (0, simplifyQuery_1.default)(query);
        }
        else if (adaptersFor$nor.includes(adapter)) {
            // memory, mongoose, mongodb
            query = (0, extra_1.rulesToQuery)(ability, method, modelName, (rule) => {
                const { conditions } = rule;
                return (rule.inverted) ? { $nor: [conditions] } : conditions;
            });
            query = (0, simplifyQuery_1.default)(query);
        }
        else {
            query = (0, extra_1.rulesToQuery)(ability, method, modelName, (rule) => {
                const { conditions } = rule;
                return (rule.inverted) ? (0, convertRuleToQuery_1.default)(rule) : conditions;
            });
            query = (0, simplifyQuery_1.default)(query);
            if (query.$and) {
                const { $and } = query;
                delete query.$and;
                $and.forEach(q => {
                    var _a;
                    query = (0, feathers_utils_1.mergeQuery)(query, q, {
                        defaultHandle: "intersect",
                        operators: (_a = service.options) === null || _a === void 0 ? void 0 : _a.whitelist,
                        useLogicalConjunction: true
                    });
                });
            }
        }
        if ((0, isEmpty_1.default)(query)) {
            return originalQuery;
        }
        if (!originalQuery) {
            return query;
        }
        else {
            const operators = (_a = service.options) === null || _a === void 0 ? void 0 : _a.whitelist;
            return (0, feathers_utils_1.mergeQuery)(originalQuery, query, {
                defaultHandle: "intersect",
                operators,
                useLogicalConjunction: true
            });
        }
    }
    else {
        return originalQuery;
    }
}
exports.default = mergeQueryFromAbility;
