import type { AnyAbility } from "@casl/ability";
import type { Application, HookContext } from "@feathersjs/feathers";
import type { RealTimeConnection } from "@feathersjs/transport-commons/lib/channels/channel/base";
import type { ChannelOptions, EventName } from "../types";
export declare const makeOptions: (app: Application, options?: Partial<ChannelOptions>) => ChannelOptions;
export declare const makeDefaultOptions: (options?: Partial<ChannelOptions>) => ChannelOptions;
export declare const getAbility: (app: Application, data: Record<string, unknown>, connection: RealTimeConnection, context: HookContext, options: Partial<ChannelOptions>) => undefined | AnyAbility;
export declare const getEventName: (method: string) => EventName;
