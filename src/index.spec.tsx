import { createNode, h, VNode } from "@opennetwork/vnode";
import { Hook } from "./index";
import { render } from "@opennetwork/vdom";

describe("index", () => {

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
        <Hook hook={hook}>
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
        <Hook hook={hook}>
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
        <Hook hook={hook}>
          <Component />
        </Hook>
    );
    await render(node, root);

    expect(references).toContain(1);
    expect(references).toContain(2);
    expect(references).toContain(3);
    expect(references).toContain(4);

  });

});
