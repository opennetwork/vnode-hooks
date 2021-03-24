import { VNode } from "@opennetwork/vnode";
import { isPromise } from "iterable";

export interface VNodeHookFn {
  (node: VNode, parent?: VNode): VNode | Promise<VNode>;
}

export interface VNodeHook {
  (node: VNode, parent?: VNode): Promise<VNode>;
}

export function hook(fn: VNodeHookFn): VNodeHook {

  async function *hookedChildren(parent: VNode, children: AsyncIterable<ReadonlyArray<VNode>>): AsyncIterable<ReadonlyArray<VNode>> {
    for await (const updates of children) {
      yield Object.freeze(
        await Promise.all(
          updates.map(child => hookFn(child, parent))
        )
      );
    }
  }

  async function hookFn(node: VNode, parent?: VNode): Promise<VNode> {
    let hooked = fn(node, parent);
    if (isPromise(hooked)) {
      hooked = await hooked;
    }
    if (!hooked) {
      return undefined;
    }
    if (!hooked.children) {
      return hooked;
    }
    return {
      ...hooked,
      children: hookedChildren(hooked, hooked.children)
    };
  }

  return hookFn;
}
