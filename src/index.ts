import { VNode } from "@opennetwork/vnode";

function isPromise<T = unknown>(value: unknown): value is Pick<Promise<T>, "then"> {
  function isPromiseLike(value: unknown): value is { then?: unknown } {
    return typeof value === "object";
  }
  return (
    isPromiseLike(value) &&
    value.then instanceof Function
  );
}

export interface VNodeHookFn<O extends VNode = VNode> {
  (node: VNode, parent?: VNode): O | Promise<O>;
}

export interface VNodeHook<O extends VNode = VNode> {
  (node: VNode, parent?: VNode): Promise<O>;
}

export function hook<O extends VNode = VNode>(fn: VNodeHookFn<O>): VNodeHook<O> {

  async function *hookedChildren(parent: VNode, children: AsyncIterable<ReadonlyArray<VNode>>): O["children"] {
    for await (const updates of children) {
      yield await Promise.all(
        updates.map(child => hookFn(child, parent))
      );
    }
  }

  async function hookFn(node: VNode, parent?: VNode): Promise<O> {
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
