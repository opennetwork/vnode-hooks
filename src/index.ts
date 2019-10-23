import { VNode } from "@opennetwork/vnode";
import { asyncExtendedIterable, isPromise } from "iterable";

export interface VNodeHook<Return extends (VNode | Promise<VNode>) = (VNode | Promise<VNode>)> {
  (node: VNode): Return;
}

export function hook(fn: VNodeHook): VNodeHook<Promise<VNode>> {
  return async function hookFn(node: VNode): Promise<VNode> {
    let hooked = fn(node);
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
        children => asyncExtendedIterable(children).map(hookFn)
      )
    };
  };
}
