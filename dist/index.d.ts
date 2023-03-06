import * as _feathersjs_feathers from '@feathersjs/feathers';
import { HookContext, Application, NextFunction, Id, Service, Query } from '@feathersjs/feathers';
import { AnyMongoAbility, AnyAbility, SubjectRawRule, MongoQuery, ClaimRawRule, Abilities, Subject } from '@casl/ability';
import { RealTimeConnection, Channel } from '@feathersjs/transport-commons';
import { AnyObject } from '@casl/ability/dist/types/types';
import { Rule } from '@casl/ability/dist/types/Rule';
import * as _feathersjs_adapter_commons from '@feathersjs/adapter-commons';
import { AdapterBase } from '@feathersjs/adapter-commons';
import { PartialDeep } from 'type-fest';

type AnyData = Record<string, any>;
type Adapter = "@feathersjs/memory" | "@feathersjs/knex" | "@feathersjs/mongodb" | "feathers-sequelize";
interface ServiceCaslOptions {
    availableFields: string[];
}
interface CaslParams<A extends AnyMongoAbility = AnyMongoAbility> {
    ability?: A;
    casl?: {
        ability: A | (() => A);
    };
}
interface HookBaseOptions<H extends HookContext = HookContext> {
    ability: AnyAbility | ((context: H) => AnyAbility | Promise<AnyAbility>);
    actionOnForbidden: undefined | (() => void);
    checkAbilityForInternal: boolean;
    checkMultiActions: boolean;
    modelName: GetModelName;
    notSkippable: boolean;
}
interface CheckBasicPermissionHookOptions<H extends HookContext = HookContext> extends HookBaseOptions<H> {
    checkCreateForData: boolean | ((context: H) => boolean);
    storeAbilityForAuthorize: boolean;
}
type CheckBasicPermissionUtilsOptions<H extends HookContext = HookContext> = Omit<CheckBasicPermissionHookOptions<H>, "notSkippable">;
type CheckBasicPermissionHookOptionsExclusive<H extends HookContext = HookContext> = Pick<CheckBasicPermissionHookOptions<H>, Exclude<keyof CheckBasicPermissionHookOptions, keyof HookBaseOptions>>;
type AvailableFieldsOption<H extends HookContext = HookContext> = string[] | ((context: H) => string[]);
interface AuthorizeChannelCommonsOptions<H extends HookContext = HookContext> {
    availableFields: AvailableFieldsOption<H>;
}
interface AuthorizeHookOptions<H extends HookContext = HookContext> extends HookBaseOptions<H>, AuthorizeChannelCommonsOptions<H> {
    adapter: Adapter;
    useUpdateData: boolean;
    usePatchData: boolean;
}
type AuthorizeHookOptionsExclusive<H extends HookContext = HookContext> = Pick<AuthorizeHookOptions<H>, Exclude<keyof AuthorizeHookOptions<H>, keyof HookBaseOptions<H>>>;
type GetModelName<H extends HookContext = HookContext> = string | ((context: H) => string);
type EventName = "created" | "updated" | "patched" | "removed";
interface ChannelOptions extends AuthorizeChannelCommonsOptions {
    ability: AnyAbility | ((app: Application, connection: RealTimeConnection, data: unknown, context: HookContext) => Promise<AnyAbility> | AnyAbility);
    /** Easy way to disable filtering, default: `false` */
    activated: boolean;
    /** Channel that's used when there occurs an error, default: `['authenticated']` */
    channelOnError: string[];
    /** Prefiltered channels, default: `app.channel(app.channels)` */
    channels: Channel | Channel[];
    modelName: GetModelName;
    restrictFields: boolean;
    /** change action to use for events. For example: `'receive'`, default: `'get'` */
    useActionName: string | {
        [e in EventName]?: string;
    };
}
interface GetConditionalQueryOptions {
    actionOnForbidden?(): void;
}
interface HasRestrictingFieldsOptions {
    availableFields: string[];
}
interface InitOptions<H extends HookContext = HookContext> {
    defaultAdapter: Adapter;
    authorizeHook: AuthorizeHookOptions<H>;
    channels: ChannelOptions;
}
interface GetMinimalFieldsOptions {
    availableFields?: string[];
    checkCan?: boolean;
}
type Path = string | Array<string | number>;
interface ThrowUnlessCanOptions extends Pick<HookBaseOptions, "actionOnForbidden"> {
    skipThrow: boolean;
}
interface UtilCheckCanOptions extends ThrowUnlessCanOptions {
    checkGeneral?: boolean;
    useConditionalSelect?: boolean;
}

declare const authorize: <H extends HookContext<_feathersjs_feathers.Application<any, any>, any> = HookContext<_feathersjs_feathers.Application<any, any>, any>>(_options?: Partial<AuthorizeHookOptions>) => (context: H, next?: NextFunction) => Promise<any>;

declare const checkBasicPermission: (_options?: Partial<CheckBasicPermissionHookOptions>) => (context: HookContext) => Promise<HookContext>;

declare const getChannelsWithReadAbility: (app: Application, data: AnyData, context: HookContext, _options?: Partial<ChannelOptions>) => Promise<undefined | Channel | Channel[]>;

declare const makeChannelOptions: (app: Application, options?: Partial<ChannelOptions>) => ChannelOptions;
declare const makeDefaultOptions: (options?: Partial<ChannelOptions>) => ChannelOptions;
declare const getAbility: (app: Application, data: Record<string, unknown>, connection: RealTimeConnection, context: HookContext, options: Partial<ChannelOptions>) => Promise<undefined | AnyAbility>;
declare const getEventName: (method: string) => EventName;

declare const checkBasicPermissionUtil: (context: HookContext, _options?: Partial<CheckBasicPermissionUtilsOptions>) => Promise<HookContext>;

declare const checkCan: <S>(ability: AnyAbility, id: Id, method: string, modelName: string, service: Service<S, Partial<S>, _feathersjs_feathers.Params<_feathersjs_feathers.Query>, Partial<Partial<S>>>, providedOptions?: Partial<UtilCheckCanOptions>) => Promise<boolean>;

declare const convertRuleToQuery: (rule: SubjectRawRule<any, any, MongoQuery<AnyObject>> | ClaimRawRule<any>, options?: GetConditionalQueryOptions) => Query;

declare function couldHaveRestrictingFields(ability: AnyAbility, action: string, subjectType: string): boolean;

declare const getAvailableFields: (context: HookContext, options?: Partial<Pick<AuthorizeChannelCommonsOptions, "availableFields">>) => undefined | string[];

declare const getModelName: (modelName: string | ((context: HookContext) => string), context: HookContext) => string;

declare const hasRestrictingConditions: (ability: AnyAbility, action: string, modelName: string) => Rule<Abilities, unknown>[] | false;

declare const hasRestrictingFields: (ability: AnyAbility, action: string, subject: Subject, options?: HasRestrictingFieldsOptions) => boolean | string[];

declare const mergeQueryFromAbility: <T>(app: Application, ability: AnyAbility, method: string, modelName: string, originalQuery: Query, service: AdapterBase<T, T, Partial<T>, _feathersjs_adapter_commons.AdapterParams<_feathersjs_adapter_commons.AdapterQuery, Partial<_feathersjs_adapter_commons.AdapterServiceOptions>>, _feathersjs_adapter_commons.AdapterServiceOptions, _feathersjs_feathers.Id>, options: Pick<AuthorizeHookOptions, "adapter">) => Query;

declare const simplifyQuery: (query: Query, replaceAnd?: boolean, replaceOr?: boolean) => Query;

declare const getFieldsForConditions: (ability: AnyAbility, action: string, modelName: string) => string[];

declare const getMinimalFields: (ability: AnyAbility, action: string, subject: Record<string, unknown>, options: GetMinimalFieldsOptions) => string[];

declare const _default: (options?: PartialDeep<InitOptions>) => (app: Application) => void;

export { Adapter, AnyData, AuthorizeChannelCommonsOptions, AuthorizeHookOptions, AuthorizeHookOptionsExclusive, AvailableFieldsOption, CaslParams, ChannelOptions, CheckBasicPermissionHookOptions, CheckBasicPermissionHookOptionsExclusive, CheckBasicPermissionUtilsOptions, EventName, GetConditionalQueryOptions, GetMinimalFieldsOptions, GetModelName, HasRestrictingFieldsOptions, HookBaseOptions, InitOptions, Path, ServiceCaslOptions, ThrowUnlessCanOptions, UtilCheckCanOptions, authorize, checkBasicPermission, checkBasicPermissionUtil, checkCan, convertRuleToQuery, couldHaveRestrictingFields, _default as default, getAbility, getAvailableFields, getChannelsWithReadAbility, getEventName, getFieldsForConditions, getMinimalFields, getModelName, hasRestrictingConditions, hasRestrictingFields, makeChannelOptions, makeDefaultOptions, mergeQueryFromAbility, simplifyQuery };
