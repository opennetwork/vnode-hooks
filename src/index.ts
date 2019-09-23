import { VNode } from "@opennetwork/vnode";
import { AsyncHooks, AsyncHook, asyncHooks } from "iterable";

export interface VNodeHooks extends AsyncHooks<VNode, AsyncIterable<VNode>, AsyncIterator<VNode>> {

}

export interface VNodeChildrenHooks extends AsyncHooks<AsyncIterable<VNode>, AsyncIterable<AsyncIterable<VNode>>, AsyncIterator<AsyncIterable<VNode>>> {

}

export function hooks(hooks: VNodeHooks, children?: VNodeChildrenHooks): AsyncHook<VNode, AsyncIterable<VNode>> {
  return async function *hooked(instance: AsyncIterable<VNode>) {
    for await (const node of asyncHooks(hooks)(instance)) {
      if (!children || !node.children) {
        yield node;
      } else {
        yield {
          ...node,
          children: asyncHooks(children)(node.children)
        };
      }
    }
  };
}
