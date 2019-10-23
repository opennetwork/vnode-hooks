import { VNode } from "@opennetwork/vnode";
import { asyncExtendedIterable, isPromise } from "iterable";

export interface VNodeHookFn {
  (node: VNode, parent?: VNode): VNode | Promise<VNode>;
}

export interface VNodeHook {
  (node: VNode, parent?: VNode): Promise<VNode>;
}

export function hook(fn: VNodeHookFn): VNodeHook {
  return async function hookFn(node: VNode, parent?: VNode): Promise<VNode> {
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
      children: asyncExtendedIterable(hooked.children).map(
        children => asyncExtendedIterable(children).map(child => hookFn(child, parent))
      )
    };
  };
}
