import { getItemsIsArray, mergeArrays, mergeQuery, isMulti, markHookForSkip, shouldSkip } from 'feathers-utils';
import _get from 'lodash/get.js';
import _set from 'lodash/set.js';
import { Forbidden } from '@feathersjs/errors';
import { subject, detectSubjectType } from '@casl/ability';
import _isPlainObject from 'lodash/isPlainObject.js';
import { permittedFieldsOf, rulesToQuery } from '@casl/ability/extra';
import _isEmpty from 'lodash/isEmpty.js';
import _isEqual from 'lodash/isEqual.js';
import _cloneDeep from 'lodash/cloneDeep.js';
import { replaceItems } from 'feathers-hooks-common';
import _pick from 'lodash/pick.js';
import { Channel } from '@feathersjs/transport-commons';

const defaultOptions$3 = {
  ability: void 0,
  actionOnForbidden: void 0,
  checkMultiActions: false,
  checkAbilityForInternal: false,
  modelName: (context) => {
    return context.path;
  },
  notSkippable: false
};
const makeDefaultBaseOptions = () => {
  return Object.assign({}, defaultOptions$3);
};
const checkCreatePerItem = (context, ability, modelName, options) => {
  const { method } = context;
  if (method !== "create" || !options.checkCreateForData) {
    return context;
  }
  const checkCreateForData = typeof options.checkCreateForData === "function" ? options.checkCreateForData(context) : true;
  if (!checkCreateForData) {
    return context;
  }
  const { items } = getItemsIsArray(context);
  for (let i = 0, n = items.length; i < n; i++) {
    throwUnlessCan(
      ability,
      method,
      subject(modelName, items[i]),
      modelName,
      options
    );
  }
  return context;
};

const defaultOptions$2 = {
  checkCreateForData: false,
  storeAbilityForAuthorize: false
};
const makeOptions$2 = (options) => {
  options = options || {};
  return Object.assign(makeDefaultBaseOptions(), defaultOptions$2, options);
};
const checkBasicPermissionUtil = async (context, _options) => {
  const options = makeOptions$2(_options);
  const { method } = context;
  if (!options.modelName) {
    return context;
  }
  const modelName = typeof options.modelName === "string" ? options.modelName : options.modelName(context);
  if (!modelName) {
    return context;
  }
  const ability = await getAbility$1(context, options);
  if (!ability) {
    return context;
  }
  if (options.checkMultiActions) {
    checkMulti(context, ability, modelName, options);
  }
  throwUnlessCan(ability, method, modelName, modelName, options);
  checkCreatePerItem(context, ability, modelName, options);
  if (options.storeAbilityForAuthorize) {
    setPersistedConfig(context, "ability", ability);
  }
  setPersistedConfig(context, "madeBasicCheck", true);
  return context;
};

const getFieldsForConditions = (ability, action, modelName) => {
  const rules = ability.possibleRulesFor(action, modelName);
  const allFields = [];
  for (const rule of rules) {
    if (!rule.conditions) {
      continue;
    }
    const fields = Object.keys(rule.conditions);
    fields.forEach((field) => {
      if (!allFields.includes(field)) {
        allFields.push(field);
      }
    });
  }
  return allFields;
};

const makeOptions$1 = (providedOptions) => {
  const defaultOptions = {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    actionOnForbidden: () => {
    },
    checkGeneral: true,
    skipThrow: false,
    useConditionalSelect: true
  };
  return Object.assign(defaultOptions, providedOptions || {});
};
const checkCan = async (ability, id, method, modelName, service, providedOptions) => {
  const options = makeOptions$1(providedOptions);
  if (options.checkGeneral) {
    const can2 = throwUnlessCan(ability, method, modelName, modelName, options);
    if (!can2) {
      return false;
    }
  }
  let params;
  if (options.useConditionalSelect) {
    const $select = getFieldsForConditions(ability, method, modelName);
    params = {
      query: { $select }
    };
  }
  const getMethod = service._get ? "_get" : "get";
  const item = await service[getMethod](id, params);
  const can = throwUnlessCan(
    ability,
    method,
    subject(modelName, item),
    modelName,
    options
  );
  return can;
};

const invertedMap = {
  $gt: "$lte",
  $gte: "$lt",
  $lt: "$gte",
  $lte: "$gt",
  $in: "$nin",
  $nin: "$in",
  $ne: (prop) => {
    return prop["$ne"];
  }
};
const supportedOperators = Object.keys(invertedMap);
const invertedProp = (prop, name) => {
  const map = invertedMap[name];
  if (typeof map === "string") {
    return { [map]: prop[name] };
  } else if (typeof map === "function") {
    return map(prop);
  }
};
const convertRuleToQuery = (rule, options) => {
  const { conditions, inverted } = rule;
  if (!conditions) {
    if (inverted && options?.actionOnForbidden) {
      options.actionOnForbidden();
    }
    return void 0;
  }
  if (inverted) {
    const newConditions = {};
    for (const prop in conditions) {
      if (_isPlainObject(conditions[prop])) {
        const obj = conditions[prop];
        for (const name in obj) {
          if (!supportedOperators.includes(name)) {
            console.error(`CASL: not supported property: ${name}`);
            continue;
          }
          newConditions[prop] = invertedProp(obj, name);
        }
      } else {
        newConditions[prop] = { $ne: conditions[prop] };
      }
    }
    return newConditions;
  } else {
    return conditions;
  }
};

function couldHaveRestrictingFields(ability, action, subjectType) {
  return ability.possibleRulesFor(action, subjectType).some((rule) => {
    return !!rule.fields;
  });
}

const getAvailableFields = (context, options) => {
  return !options?.availableFields ? void 0 : typeof options.availableFields === "function" ? options.availableFields(context) : options.availableFields;
};

const getModelName = (modelName, context) => {
  if (modelName === void 0) {
    return context.path;
  }
  if (typeof modelName === "string") {
    return modelName;
  }
  if (typeof modelName === "function") {
    return modelName(context);
  }
  throw new Error("feathers-casl: 'modelName' is not a string or function");
};

const hasRestrictingConditions = (ability, action, modelName) => {
  const rules = ability.possibleRulesFor(action, modelName);
  const hasConditions = rules.length === 0 || rules.some((x) => !!x.conditions);
  return hasConditions ? rules : false;
};

const getMinimalFields = (ability, action, subject, options) => {
  if (options.checkCan && !ability.can(action, subject)) {
    return [];
  }
  const subjectType = detectSubjectType(subject);
  const rules = ability.possibleRulesFor(action, subjectType).filter((rule) => {
    const { fields: fields2 } = rule;
    const matched = rule.matchesConditions(subject);
    return fields2 && matched;
  });
  if (rules.length === 0) {
    return options.availableFields || [];
  }
  let fields;
  if (options.availableFields) {
    fields = options.availableFields;
  } else {
    fields = rules.find((x) => !x.inverted)?.fields;
    if (!fields) {
      return [];
    }
  }
  rules.forEach((rule) => {
    if (rule.inverted) {
      fields = fields.filter((x) => !rule.fields.includes(x));
    } else {
      fields = mergeArrays(fields, rule.fields, "intersect");
    }
  });
  return fields;
};

function areSameArray(arr1, arr2) {
  if (arr1.length != arr2.length) {
    return false;
  }
  const arr1test = arr1.slice().sort();
  const arr2test = arr2.slice().sort();
  const result = !arr1test.some((val, idx) => val !== arr2test[idx]);
  return result;
}
const hasRestrictingFields = (ability, action, subject, options) => {
  let fields;
  if (typeof subject !== "string") {
    fields = getMinimalFields(
      ability,
      action,
      subject,
      {
        availableFields: options.availableFields,
        checkCan: false
      }
    );
  } else {
    const permittedFieldsOfOptions = {
      fieldsFrom: (rule) => {
        return rule.fields || options.availableFields || [];
      }
    };
    fields = permittedFieldsOf(
      ability,
      action,
      subject,
      permittedFieldsOfOptions
    );
  }
  if (fields.length === 0 && !options.availableFields) {
    return false;
  }
  if (fields.length > 0) {
    if (options.availableFields === fields || options.availableFields && areSameArray(fields, options.availableFields)) {
      return false;
    } else {
      return fields;
    }
  }
  return true;
};

const simplifyQuery = (query, replaceAnd = true, replaceOr = true) => {
  if (!query.$and && !query.$or) {
    return query;
  }
  let result = _cloneDeep(query);
  if (result.$and && !result.$and.length) {
    delete result.$and;
  }
  if (result.$or && !result.$or.length) {
    delete result.$or;
  }
  if (result.$and) {
    const $and = [];
    result.$and.forEach((q) => {
      q = simplifyQuery(q, true, true);
      if ($and.some((x) => _isEqual(x, q)))
        return;
      $and.push(q);
    });
    if (replaceAnd && $and.length === 1 && Object.keys(result).length === 1) {
      result = $and[0];
    } else {
      result.$and = $and;
    }
  }
  if (result.$or) {
    const $or = [];
    result.$or.forEach((q) => {
      q = simplifyQuery(q, true, true);
      if ($or.some((x) => _isEqual(x, q)))
        return;
      $or.push(q);
    });
    if (replaceOr && $or.length === 1 && Object.keys(result).length === 1) {
      result = $or[0];
    } else {
      result.$or = $or;
    }
  }
  return result;
};

const adaptersFor$not = [];
const adaptersFor$notAsArray = [
  "feathers-sequelize"
  // "feathers-objection",
];
const adaptersFor$nor = [
  "@feathersjs/memory",
  // "feathers-mongoose",
  "@feathersjs/mongodb"
];
const mergeQueryFromAbility = (app, ability, method, modelName, originalQuery, service, options) => {
  if (hasRestrictingConditions(ability, method, modelName)) {
    const adapter = getAdapter(app, options);
    let query;
    if (adaptersFor$not.includes(adapter)) {
      query = rulesToQuery(ability, method, modelName, (rule) => {
        const { conditions } = rule;
        return rule.inverted ? { $not: conditions } : conditions;
      });
      query = simplifyQuery(query);
    } else if (adaptersFor$notAsArray.includes(adapter)) {
      query = rulesToQuery(ability, method, modelName, (rule) => {
        const { conditions } = rule;
        return rule.inverted ? { $not: [conditions] } : conditions;
      });
      query = simplifyQuery(query);
    } else if (adaptersFor$nor.includes(adapter)) {
      query = rulesToQuery(ability, method, modelName, (rule) => {
        const { conditions } = rule;
        return rule.inverted ? { $nor: [conditions] } : conditions;
      });
      query = simplifyQuery(query);
    } else {
      query = rulesToQuery(ability, method, modelName, (rule) => {
        const { conditions } = rule;
        return rule.inverted ? convertRuleToQuery(rule) : conditions;
      });
      query = simplifyQuery(query);
      if (query.$and) {
        const { $and } = query;
        delete query.$and;
        $and.forEach((q) => {
          query = mergeQuery(query, q, {
            defaultHandle: "intersect",
            operators: service.options?.operators,
            filters: service.options?.filters,
            useLogicalConjunction: true
          });
        });
      }
    }
    if (_isEmpty(query)) {
      return originalQuery;
    }
    if (!originalQuery) {
      return query;
    } else {
      return mergeQuery(originalQuery, query, {
        defaultHandle: "intersect",
        operators: service.options?.operators,
        filters: service.options?.filters,
        useLogicalConjunction: true
      });
    }
  } else {
    return originalQuery;
  }
};

const HOOKNAME$1 = "authorize";
const makeOptions = (app, options) => {
  options = options || {};
  return Object.assign(
    makeDefaultBaseOptions(),
    defaultOptions$1,
    getAppOptions$1(app),
    options
  );
};
const defaultOptions$1 = {
  adapter: void 0,
  availableFields: (context) => {
    const availableFields = context.service.options?.casl?.availableFields;
    return getAvailableFields(context, { availableFields });
  },
  usePatchData: false,
  useUpdateData: false
};
const makeDefaultOptions$1 = (options) => {
  return Object.assign(makeDefaultBaseOptions(), defaultOptions$1, options);
};
const getAppOptions$1 = (app) => {
  const caslOptions = app?.get("casl");
  return caslOptions && caslOptions.authorizeHook ? caslOptions.authorizeHook : {};
};
const getAdapter = (app, options) => {
  if (options.adapter) {
    return options.adapter;
  }
  const caslAppOptions = app?.get("casl");
  if (caslAppOptions?.defaultAdapter) {
    return caslAppOptions.defaultAdapter;
  }
  return "@feathersjs/memory";
};
const getAbility$1 = (context, options) => {
  if (context?.params?.ability) {
    if (typeof context.params.ability === "function") {
      const ability = context.params.ability(context);
      return Promise.resolve(ability);
    } else {
      return Promise.resolve(context.params.ability);
    }
  }
  const persistedAbility = getPersistedConfig(context, "ability");
  if (persistedAbility) {
    if (typeof persistedAbility === "function") {
      const ability = persistedAbility(context);
      return Promise.resolve(ability);
    } else {
      return Promise.resolve(persistedAbility);
    }
  }
  if (!options.checkAbilityForInternal && !context.params?.provider) {
    return Promise.resolve(void 0);
  }
  if (options?.ability) {
    if (typeof options.ability === "function") {
      const ability = options.ability(context);
      return Promise.resolve(ability);
    } else {
      return Promise.resolve(options.ability);
    }
  }
  throw new Forbidden(
    `You're not allowed to ${context.method} on '${context.path}'`
  );
};
const throwUnlessCan = (ability, method, resource, modelName, options) => {
  if (ability.cannot(method, resource)) {
    if (options.actionOnForbidden)
      options.actionOnForbidden();
    if (!options.skipThrow) {
      throw new Forbidden(`You are not allowed to ${method} ${modelName}`);
    }
    return false;
  }
  return true;
};
const refetchItems = async (context, params) => {
  if (!context.result) {
    return;
  }
  const { items } = getItemsIsArray(context);
  if (!items) {
    return;
  }
  const idField = context.service.options?.id;
  const ids = items.map((item) => item[idField]);
  params = Object.assign({}, params, { paginate: false });
  markHookForSkip(HOOKNAME$1, "all", { params });
  delete params.ability;
  const query = Object.assign({}, params.query, { [idField]: { $in: ids } });
  params = Object.assign({}, params, { query });
  return await context.service.find(params);
};
const getConditionalSelect = ($select, ability, method, modelName) => {
  if (!$select?.length) {
    return void 0;
  }
  const fields = getFieldsForConditions(ability, method, modelName);
  if (!fields.length) {
    return void 0;
  }
  const fieldsToAdd = fields.filter((field) => !$select.includes(field));
  if (!fieldsToAdd.length) {
    return void 0;
  }
  return [...$select, ...fieldsToAdd];
};
const checkMulti = (context, ability, modelName, options) => {
  const { method } = context;
  const currentIsMulti = isMulti(context);
  if (!currentIsMulti) {
    return true;
  }
  if (method === "find" && ability.can(method, modelName) || ability.can(`${method}-multi`, modelName)) {
    return true;
  }
  if (options?.actionOnForbidden)
    options.actionOnForbidden();
  throw new Forbidden(`You're not allowed to multi-${method} ${modelName}`);
};
const setPersistedConfig = (context, key, val) => {
  return _set(context, `params.casl.${key}`, val);
};
function getPersistedConfig(context, key) {
  return _get(context, `params.casl.${key}`);
}

const authorizeAfter = async (context, options) => {
  if (shouldSkip(HOOKNAME$1, context, options) || !context.params) {
    return context;
  }
  let { isArray, items } = getItemsIsArray(context);
  if (!items.length) {
    return context;
  }
  options = makeOptions(context.app, options);
  const modelName = getModelName(options.modelName, context);
  if (!modelName) {
    return context;
  }
  const skipCheckConditions = getPersistedConfig(
    context,
    "skipRestrictingRead.conditions"
  );
  const skipCheckFields = getPersistedConfig(
    context,
    "skipRestrictingRead.fields"
  );
  if (skipCheckConditions && skipCheckFields) {
    return context;
  }
  const { params } = context;
  params.ability = await getAbility$1(context, options);
  if (!params.ability) {
    return context;
  }
  const { ability } = params;
  const availableFields = getAvailableFields(context, options);
  const hasRestrictingFieldsOptions = {
    availableFields
  };
  const getOrFind = isArray ? "find" : "get";
  const $select = params.query?.$select;
  if (context.method !== "remove") {
    const $newSelect = getConditionalSelect(
      $select,
      ability,
      getOrFind,
      modelName
    );
    if ($newSelect) {
      const _items = await refetchItems(context);
      if (_items) {
        items = _items;
      }
    }
  }
  const pickFieldsForItem = (item) => {
    if (!skipCheckConditions && !ability.can(getOrFind, subject(modelName, item))) {
      return void 0;
    }
    let fields = hasRestrictingFields(
      ability,
      getOrFind,
      subject(modelName, item),
      hasRestrictingFieldsOptions
    );
    if (fields === true) {
      return {};
    } else if (skipCheckFields || !fields && !$select) {
      return item;
    } else if (fields && $select) {
      fields = mergeArrays(fields, $select, "intersect");
    } else {
      fields = fields ? fields : $select;
    }
    return _pick(item, fields);
  };
  let result;
  if (isArray) {
    result = [];
    for (let i = 0, n = items.length; i < n; i++) {
      const item = pickFieldsForItem(items[i]);
      if (item) {
        result.push(item);
      }
    }
  } else {
    result = pickFieldsForItem(items[0]);
    if (context.method === "get" && _isEmpty(result)) {
      if (options.actionOnForbidden)
        options.actionOnForbidden();
      throw new Forbidden(
        `You're not allowed to ${context.method} ${modelName}`
      );
    }
  }
  replaceItems(context, result);
  return context;
};

const HOOKNAME = "checkBasicPermission";
const checkBasicPermission = (_options) => {
  return async (context) => {
    if (!_options?.notSkippable && (shouldSkip(HOOKNAME, context) || context.type !== "before" || !context.params)) {
      return context;
    }
    return await checkBasicPermissionUtil(context, _options);
  };
};

const authorizeBefore = async (context, options) => {
  if (shouldSkip(HOOKNAME$1, context, options) || !context.params) {
    return context;
  }
  if (!getPersistedConfig(context, "madeBasicCheck")) {
    const basicCheck = checkBasicPermission({
      notSkippable: true,
      ability: options.ability,
      actionOnForbidden: options.actionOnForbidden,
      checkAbilityForInternal: options.checkAbilityForInternal,
      checkCreateForData: true,
      checkMultiActions: options.checkMultiActions,
      modelName: options.modelName,
      storeAbilityForAuthorize: true
    });
    await basicCheck(context);
  }
  if (!options.modelName) {
    return context;
  }
  const modelName = typeof options.modelName === "string" ? options.modelName : options.modelName(context);
  if (!modelName) {
    return context;
  }
  const ability = await getAbility$1(context, options);
  if (!ability) {
    return context;
  }
  const multi = isMulti(context);
  if (multi) {
    if (!couldHaveRestrictingFields(ability, "find", modelName)) {
      setPersistedConfig(context, "skipRestrictingRead.fields", true);
    }
  }
  if (["find", "get"].includes(context.method) || isMulti && !hasRestrictingConditions(ability, "find", modelName)) {
    setPersistedConfig(context, "skipRestrictingRead.conditions", true);
  }
  const { method, id } = context;
  const availableFields = getAvailableFields(context, options);
  if (["get", "patch", "update", "remove"].includes(method) && id != null) {
    await handleSingle(context, ability, modelName, availableFields, options);
  } else if (method === "find" || ["patch", "remove"].includes(method) && id == null) {
    await handleMulti(context, ability, modelName, availableFields, options);
  } else if (method === "create") {
    checkCreatePerItem(context, ability, modelName, {
      actionOnForbidden: options.actionOnForbidden,
      checkCreateForData: true
    });
  }
  return context;
};
const handleSingle = async (context, ability, modelName, availableFields, options) => {
  const { params, method, service, id } = context;
  const query = mergeQueryFromAbility(
    context.app,
    ability,
    method,
    modelName,
    context.params?.query,
    context.service,
    options
  );
  _set(context, "params.query", query);
  if (["update", "patch"].includes(method)) {
    const queryGet = Object.assign({}, params.query || {});
    if (queryGet.$select) {
      delete queryGet.$select;
    }
    const paramsGet = Object.assign({}, params, { query: queryGet });
    const getMethod = service._get ? "_get" : "get";
    const item = await service[getMethod](id, paramsGet);
    const restrictingFields = hasRestrictingFields(
      ability,
      method,
      subject(modelName, item),
      { availableFields }
    );
    if (restrictingFields && (restrictingFields === true || restrictingFields.length === 0)) {
      if (options.actionOnForbidden) {
        options.actionOnForbidden();
      }
      throw new Forbidden("You're not allowed to make this request");
    }
    const data = !restrictingFields ? context.data : _pick(context.data, restrictingFields);
    checkData(context, ability, modelName, data, options);
    if (!restrictingFields) {
      return context;
    }
    if (_isEmpty(data)) {
      if (options.actionOnForbidden) {
        options.actionOnForbidden();
      }
      throw new Forbidden("You're not allowed to make this request");
    }
    if (method === "patch") {
      context.data = data;
    } else {
      const itemPlain = await service._get(id, {});
      context.data = Object.assign({}, itemPlain, data);
    }
  }
  return context;
};
const checkData = (context, ability, modelName, data, options) => {
  if (context.method === "patch" && !options.usePatchData || context.method === "update" && !options.useUpdateData) {
    return;
  }
  throwUnlessCan(
    ability,
    `${context.method}-data`,
    subject(modelName, data),
    modelName,
    options
  );
};
const handleMulti = async (context, ability, modelName, availableFields, options) => {
  const { method } = context;
  if (method === "patch") {
    const fields = hasRestrictingFields(ability, method, modelName, {
      availableFields
    });
    if (fields === true) {
      if (options.actionOnForbidden) {
        options.actionOnForbidden();
      }
      throw new Forbidden("You're not allowed to make this request");
    }
    if (fields && fields.length > 0) {
      const data = _pick(context.data, fields);
      context.data = data;
    }
  }
  const query = mergeQueryFromAbility(
    context.app,
    ability,
    method,
    modelName,
    context.params?.query,
    context.service,
    options
  );
  _set(context, "params.query", query);
  return context;
};

const authorize = (_options) => {
  return async (context, next) => {
    if (shouldSkip(HOOKNAME$1, context, _options) || !context.params || context.type === "error") {
      return next ? await next() : context;
    }
    const options = makeOptions(context.app, _options);
    if (next) {
      await authorizeBefore(context, options);
      await next();
      await authorizeAfter(context, options);
      return context;
    }
    return context.type === "before" ? await authorizeBefore(context, options) : await authorizeAfter(context, options);
  };
};

const makeChannelOptions = (app, options) => {
  options = options || {};
  return Object.assign({}, defaultOptions, getAppOptions(app), options);
};
const defaultOptions = {
  activated: true,
  channelOnError: ["authenticated"],
  channels: void 0,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ability: (app, connection, data, context) => {
    return connection.ability;
  },
  modelName: (context) => context.path,
  restrictFields: true,
  availableFields: (context) => {
    const availableFields = context.service.options?.casl?.availableFields;
    return getAvailableFields(context, { availableFields });
  },
  useActionName: "get"
};
const makeDefaultOptions = (options) => {
  return Object.assign({}, defaultOptions, options);
};
const getAppOptions = (app) => {
  const caslOptions = app?.get("casl");
  return caslOptions && caslOptions.channels ? caslOptions.channels : {};
};
const getAbility = async (app, data, connection, context, options) => {
  if (options.ability) {
    return typeof options.ability === "function" ? await options.ability(app, connection, data, context) : options.ability;
  } else {
    return connection.ability;
  }
};
const getEventName = (method) => {
  if (method === "create") {
    return "created";
  } else if (method === "update") {
    return "updated";
  } else if (method === "patch") {
    return "patched";
  } else if (method === "remove") {
    return "removed";
  }
  return void 0;
};

const getChannelsWithReadAbility = async (app, data, context, _options) => {
  if (!_options?.channels && !app.channels.length) {
    return void 0;
  }
  const options = makeChannelOptions(app, _options);
  const { channelOnError, activated } = options;
  const modelName = getModelName(options.modelName, context);
  if (!activated || !modelName) {
    return !channelOnError ? new Channel() : app.channel(channelOnError);
  }
  let channels = options.channels || app.channel(app.channels);
  if (!Array.isArray(channels)) {
    channels = [channels];
  }
  const dataToTest = subject(modelName, data);
  let method = "get";
  if (typeof options.useActionName === "string") {
    method = options.useActionName;
  } else {
    const eventName = getEventName(context.method);
    if (eventName && options.useActionName[eventName]) {
      method = options.useActionName[eventName];
    }
  }
  let result = [];
  if (!options.restrictFields) {
    result = channels.map((channel) => {
      return new Channel(channel.connections.filter(async (conn) => {
        const ability = await getAbility(app, data, conn, context, options);
        return ability && ability.can(method, dataToTest);
      }), channel.data);
    });
  } else {
    const connectionsPerFields = [];
    for (let i = 0, n = channels.length; i < n; i++) {
      const channel = channels[i];
      const { connections } = channel;
      for (let j = 0, o = connections.length; j < o; j++) {
        const connection = connections[j];
        const ability = await getAbility(app, data, connection, context, options);
        if (!ability || !ability.can(method, dataToTest)) {
          continue;
        }
        const availableFields = getAvailableFields(context, options);
        const fields = hasRestrictingFields(ability, method, dataToTest, {
          availableFields
        });
        if (fields && (fields === true || fields.length === 0)) {
          continue;
        }
        const connField = connectionsPerFields.find(
          (x) => _isEqual(x.fields, fields)
        );
        if (connField) {
          if (connField.connections.indexOf(connection) !== -1) {
            continue;
          }
          connField.connections.push(connection);
        } else {
          connectionsPerFields.push({
            connections: [connection],
            fields
          });
        }
      }
    }
    for (let i = 0, n = connectionsPerFields.length; i < n; i++) {
      const { fields, connections } = connectionsPerFields[i];
      const restrictedData = fields ? _pick(data, fields) : data;
      if (!_isEmpty(restrictedData)) {
        result.push(new Channel(connections, restrictedData));
      }
    }
  }
  return result.length === 1 ? result[0] : result;
};

const initialize = (options) => {
  if (options?.version) {
    throw new Error(
      "You passed 'feathers-casl' to app.configure() without a function. You probably wanted to call app.configure(casl({}))!"
    );
  }
  options = {
    defaultAdapter: options?.defaultAdapter || "@feathersjs/memory",
    authorizeHook: makeDefaultOptions$1(
      options?.authorizeHook
    ),
    channels: makeDefaultOptions(
      options?.channels
    )
  };
  return (app) => {
    if (app.get("casl")) {
      return;
    }
    app.set("casl", options);
  };
};

if (typeof module !== "undefined") {
  module.exports = Object.assign(initialize, module.exports);
}

export { authorize, checkBasicPermission, checkBasicPermissionUtil, checkCan, convertRuleToQuery, couldHaveRestrictingFields, initialize as default, getAbility, getAvailableFields, getChannelsWithReadAbility, getEventName, getFieldsForConditions, getMinimalFields, getModelName, hasRestrictingConditions, hasRestrictingFields, makeChannelOptions, makeDefaultOptions, mergeQueryFromAbility, simplifyQuery };
