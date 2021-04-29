import { createNode, h, VNode } from "@opennetwork/vnode";
import { Hook, HookFn, HookPair } from "./index";
import { assertElement, render } from "@opennetwork/vdom";
import { AsyncLocalStorage } from "async_hooks";

describe.each([
    [true],
    [false]
])("index, mutate: %p", (mutate) => {

  it("hooks only a single node", async () => {

    const reference = Symbol();
    const root = document.createElement("div");
    function Component() {
      return createNode("div", { reference: reference });
    }

    const references: unknown[] = [];
    const hook = function (node: VNode) {
      references.push(node.reference);
      return node;
    };
    const node = (
        <Hook hook={hook} mutate={mutate}>
          <Component />
        </Hook>
    );
    await render(node, root);
    expect(references).toContain(reference);


  });

  it("hooks two nodes", async () => {

    const root = document.createElement("div");
    function Component() {
      return [
        createNode("div", { reference: 1 }),
        createNode("div", { reference: 2 })
      ];
    }

    const references: unknown[] = [];
    const hook = function (node: VNode) {
      references.push(node.reference);
      return node;
    };
    const node = (
        <Hook hook={hook} mutate={mutate}>
          <Component />
        </Hook>
    );
    await render(node, root);

    expect(references).toContain(1);
    expect(references).toContain(2);

  });

  it("hooks four nodes", async () => {

    const root = document.createElement("div");
    function Component() {
      return [
        createNode("div", { reference: 1 }),
        createNode("div", { reference: 2 },
            createNode("span", { reference: 3 }),
            createNode("span", { reference: 4 })
        )
      ];
    }

    const references: unknown[] = [];
    const hook = function (node: VNode) {
      references.push(node.reference);
      return node;
    };
    const node = (
        <Hook hook={hook} mutate={mutate}>
          <Component />
        </Hook>
    );
    await render(node, root);

    console.log(root.outerHTML);

    expect(references).toContain(1);
    expect(references).toContain(2);
    expect(references).toContain(3);
    expect(references).toContain(4);

  });


  it("hooks four nodes with hook pair", async () => {

    const root = document.createElement("div");
    function Component() {
      return [
        createNode("div", { reference: 1 }),
        createNode("div", { reference: 2 },
            createNode("span", { reference: 3 }),
            createNode("span", { reference: 4 })
        )
      ];
    }

    const references: unknown[] = [];
    const otherReferences: unknown[] = [];
    const otherHook = function (node: VNode): HookPair {
      otherReferences.push(node.reference);
      return [node, otherHook];
    };
    const hook = function (node: VNode): HookPair {
      references.push(node.reference);
      return [node, node.reference === 2 ? otherHook : hook];
    };
    const node = (
        <Hook hook={hook} mutate={mutate}>
          <Component />
        </Hook>
    );
    await render(node, root);

    console.log(root.outerHTML);

    expect(references).toContain(1);
    expect(references).toContain(2);
    expect(otherReferences).toContain(3);
    expect(otherReferences).toContain(4);

  });

  describe("node async hooks",  () => {

    it("works", async () => {

      const key = `${Math.random()}`;
      const value = `${Math.random()}`;
      const asyncKey = `${Math.random()}`;
      const asyncValue = `${Math.random()}`;

      const store = {
        [key]: value,
        [asyncKey]: asyncValue
      };
      const storage = new AsyncLocalStorage<typeof store>();

      function Sync() {
        const store = storage.getStore();
        expect(store).toBeTruthy();
        return store[key];
      }

      async function *Async() {
        const initialStore = storage.getStore();
        await new Promise(resolve => setTimeout(resolve, 50));
        const store = storage.getStore();
        expect(store).toEqual(initialStore);
        expect(store).toBeTruthy();
        yield store[key];
      }

      const hooked = (
          <Hook hook={hookStorage(storage, store)} mutate={mutate}>
            {h("a", { }, <Sync />)}
            {h("b", { }, <Async />)}
          </Hook>
      );

      const root = document.createElement("div");

      await render(hooked, root);

      const syncResult = root.querySelector("a");
      const asyncResult = root.querySelector("b");

      assertElement(syncResult);
      assertElement(asyncResult);
      expect(syncResult.innerHTML).toEqual(value);
      expect(asyncResult.innerHTML).toEqual(value);

    });

    function hookStorage<T>(storage: AsyncLocalStorage<T>, store: T): HookFn {
      return node => hookWithStorage(node, storage, store);
    }

    function hookWithStorage<T>(node: VNode, storage: AsyncLocalStorage<T>, store: T) {
      return new Proxy(node, {
        get<K extends keyof VNode>(target: VNode, p: K) {
          if (p !== "children" || !target.children) {
            return target[p];
          }
          return hookChildren(target, storage, store);
        }
      });
    }

    async function *hookChildren<T>(node: VNode, storage: AsyncLocalStorage<T>, store: T): VNode["children"] {
      const iterator = node.children[Symbol.asyncIterator]();
      let result;
      try {

        do {
          try {
            result = await storage.run(store, () => {
              return iterator.next();
            });
            if (isYieldResult(result)) {
              yield result.value;
            }
          } catch (error) {
            const throwResult = await storage.run(store, () => {
              return iterator.throw(error);
            });
            if (isYieldResult(throwResult)) {
              yield throwResult.value;
            }
            result = throwResult ?? result;
          }
        } while (!result.done);
      } finally {
        await storage.run(store, () => {
          return iterator.return();
        });
      }

      function isYieldResult<T>(result: IteratorResult<T>): result is IteratorYieldResult<T> {
        return !result.done;
      }
    }

  });

});
