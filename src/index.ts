import { VNode } from "@opennetwork/vnode";
import { AsyncHooks, AsyncHook, asyncHooks } from "iterable";

export interface VNodeHooks extends AsyncHooks<VNode, AsyncIterable<VNode>, AsyncIterator<VNode>> {

}

export interface VNodeChildrenHooks extends AsyncHooks<AsyncIterable<VNode>, AsyncIterable<AsyncIterable<VNode>>, AsyncIterator<AsyncIterable<VNode>>> {

}

export function hooks(hooks: VNodeHooks, children?: VNodeChildrenHooks): AsyncHook<VNode, AsyncIterable<VNode>> {
  const hook = asyncHooks(hooks);
  const childrenHook = children ? asyncHooks(children) : undefined;
  return async function *hooked(instance: AsyncIterable<VNode>) {
    for await (const node of hook(instance)) {
      if (!childrenHook || !node.children) {
        yield node;
      } else {
        yield {
          ...node,
          children: childrenHook(node.children)
        };
      }
    }
  };
}
