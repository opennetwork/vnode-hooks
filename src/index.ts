import { VNode, createNode } from "@opennetwork/vnode";

function isPromise<T = unknown>(value: unknown): value is Pick<Promise<T>, "then"> {
  function isPromiseLike(value: unknown): value is { then?: unknown } {
    return typeof value === "object";
  }
  return (
    isPromiseLike(value) &&
    value.then instanceof Function
  );
}

export interface HookFn {
  (node: VNode): VNode | Promise<VNode>;
}

export interface HookOptions {
  hook: HookFn;
}

export async function *Hook({ hook }: HookOptions, node: VNode): AsyncIterable<VNode | VNode[]> {
  let hooked = hook(node);
  if (isPromise(hooked)) {
    hooked = await hooked;
  }
  if (!hooked.children) {
    return hooked;
  }
  for await (const children of hooked.children) {
    yield children.map(child => (
      createNode(
        Hook,
        { hook },
        child
      )
    ));
  }
}
