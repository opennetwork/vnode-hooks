import { VNode } from "@opennetwork/vnode";
import { AsyncHooks, AsyncHook, asyncHooks } from "iterable";

export interface VNodeHooks extends AsyncHooks<VNode, AsyncIterable<VNode>, AsyncIterator<VNode>> {

}

export interface VNodeChildrenHooks extends AsyncHooks<AsyncIterable<VNode>, AsyncIterable<AsyncIterable<VNode>>, AsyncIterator<AsyncIterable<VNode>>> {

}

export interface VNodeHook extends AsyncHook<VNode, AsyncIterable<VNode>> {

}

export function hooks(hooks?: VNodeHooks, children?: VNodeChildrenHooks): VNodeHook {
  const hook = hooks ? asyncHooks(hooks) : undefined;
  const childrenHook = children ? asyncHooks(children) : undefined;
  return async function *hooked(instance: AsyncIterable<VNode>) {
    if (!hook && !childrenHook) {
      return instance; // Nothing ever to be done
    }
    for await (const node of (hook ? hook(instance) : instance)) {
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
