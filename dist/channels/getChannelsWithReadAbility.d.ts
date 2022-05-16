import "@feathersjs/transport-commons";
import { Channel } from "@feathersjs/transport-commons/lib/channels/channel/base";
import type { HookContext, Application } from "@feathersjs/feathers";
import type { ChannelOptions } from "../types";
declare const _default: (app: Application, data: Record<string, any>, context: HookContext, _options?: Partial<ChannelOptions>) => Promise<undefined | Channel | Channel[]>;
export default _default;
