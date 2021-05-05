import assert from "assert";
import feathers from "@feathersjs/feathers";
import { createAliasResolver, defineAbility } from "@casl/ability";

const resolveAction = createAliasResolver({
  update: "patch",
  read: ["get", "find"],
  delete: "remove",
});

import { Application } from "@feathersjs/feathers";

import authorize from "../../../../../lib/hooks/authorize/authorize.hook";
import { Adapter, AuthorizeHookOptions } from "../../../../../lib/types";

export default async function(
  adapterName: Adapter,
  makeService: () => unknown,
  clean: (app, service) => Promise<void>,
  authorizeHookOptions: Partial<AuthorizeHookOptions>,
  afterHooks?: unknown[]
): Promise<void> {
  let app: Application;
  let service;
  let id;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const itSkip = (
    adapterToTest: Adapter | Adapter[]
  ): Mocha.TestFunction | Mocha.PendingTestFunction => {
    const condition = (typeof adapterToTest === "string")
      ? adapterName === adapterToTest
      : adapterToTest.includes(adapterName);
    return (condition)
      ? it.skip
      : it;
  };
      
  describe(`${adapterName}: beforeAndAfter - get`, function () {

    beforeEach(async function () {
      app = feathers();
      app.use(
        "tests",
        makeService()
      );
      service = app.service("tests");
    
      // eslint-disable-next-line prefer-destructuring
      id = service.options.id;
    
      const options = Object.assign({
        availableFields: [id, "userId", "hi", "test", "published", "supersecret", "hidden"] 
      }, authorizeHookOptions);
      const allAfterHooks = [];
      if (afterHooks) {
        allAfterHooks.push(...afterHooks);
      }
      allAfterHooks.push(authorize(options));
      //@ts-ignore
      service.hooks({
        before: {
          all: [ authorize(options) ],
        },
        after: {
          all: allAfterHooks
        },
      });
    
      await clean(app, service);
    });

    it("returns full item", async function () {
      const readMethods = ["read", "get"];
      for (const read of readMethods) {
        const item = await service.create({ test: true, userId: 1 });
        assert(item[id] !== undefined, `item has id for read: '${read}'`);
        const returnedItem = await service.get(item[id], {
          //@ts-ignore
          ability: defineAbility((can) => {
            can(read, "tests", { userId: 1 });
          }, { resolveAction }),
        });
        assert.deepStrictEqual(
          returnedItem,
          item,
          `'create' and 'get' item are the same for read: '${read}'`
        );
      }
            
    });
      
    it("returns subset of fields", async function () {
      const item = await service.create({ test: true, userId: 1 });
      assert(item[id] !== undefined, "item has id");
      const returnedItem = await service.get(item[id], {
        //@ts-ignore
        ability: defineAbility((can) => {
          can("read", "tests", [id], { userId: 1 });
        }, { resolveAction }),
      });
      assert.deepStrictEqual(
        returnedItem,
        { [id]: item[id] },
        "'get' returns only [id]"
      );
    });
      
    it("returns restricted subset of fields with $select", async function () {
      const item = await service.create({ test: true, userId: 1, published: true });
      assert(item[id] !== undefined, "item has id");
      const returnedItem = await service.get(item[id], {
        //@ts-ignore
        ability: defineAbility((can) => {
          can("read", "tests", [id], { userId: 1 });
        }, { resolveAction }),
        query: {
          $select: [id, "userId"]
        }
      });
      assert.deepStrictEqual(
        returnedItem,
        { [id]: item[id] },
        "'get' returns only [id]"
      );
    });
      
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    it.skip("returns subset of fields with inverted fields", async function () {});
      
    it("throws forbidden for not 'can'", async function () {
      const item = await service.create({ test: true, userId: 1 });
      assert(item[id] !== undefined, "item has id");
      const returnedItem = service.get(item[id], {
        //@ts-ignore
        ability: defineAbility((can) => {
          can("read", "tests", { userId: 2 });
        }, { resolveAction }),
      });
      await assert.rejects(
        returnedItem,
        (err) => err.name === "Forbidden",
        "rejects for id not allowed"
      );
    });
      
    it("throws forbidden for explicit 'cannot'", async function () {
      const item = await service.create({ test: true, userId: 1 });
      assert(item[id] !== undefined, "item has id");
      const returnedItem = service.get(item[id], {
        //@ts-ignore
        ability: defineAbility((can, cannot) => {
          cannot("read", "tests", { userId: 1 });
        }, { resolveAction }),
      });
      await assert.rejects(
        returnedItem,
        (err) => err.name === "Forbidden",
        "rejects for id not allowed"
      );
    });
      
    it("throws if $select and restricted fields don't overlap", async function() {
      const item = await service.create({ test: true, userId: 1, supersecret: true, hidden: true });
      assert(item[id] !== undefined, "item has id");
      const promise = service.get(item[id], {
        query: { $select: [id, "supersecret", "hidden"] },
        //@ts-ignore
        ability: defineAbility((can) => {
          can("read", "tests", ["test", "userId"]);
        }, { resolveAction }),
      });
      await assert.rejects(
        promise,
        (err) => err.name === "Forbidden",
        "rejects for id not allowed"
      );
    });
  });
}