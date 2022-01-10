import type { AnyAbility } from "@casl/ability";
import type { Application, Query } from "@feathersjs/feathers";
import type { AdapterService } from "@feathersjs/adapter-commons";
import type { AuthorizeHookOptions } from "../types";
export default function mergeQueryFromAbility<T>(app: Application, ability: AnyAbility, method: string, modelName: string, originalQuery: Query, service: AdapterService<T>, options: Pick<AuthorizeHookOptions, "adapter">): Query;
