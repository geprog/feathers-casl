import { Ability, RawRuleFrom, AbilityOptions, AbilityTuple, MongoQuery } from "@casl/ability";
declare function makeAbilityFromRules<A extends AbilityTuple = AbilityTuple, C extends MongoQuery = MongoQuery>(rules?: RawRuleFrom<A, C>[], options?: AbilityOptions<A, C>): Ability;
export default makeAbilityFromRules;
