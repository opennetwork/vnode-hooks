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

export type HookPair = [VNode, HookFn];

export interface HookFn {
  (node: VNode): VNode | Promise<VNode> | HookPair | Promise<HookPair>;
}

export interface HookOptions {
  hook: HookFn;
}

export async function *Hook({ hook }: HookOptions, node: VNode): AsyncIterable<VNode | VNode[]> {
  const [hooked, nextHook] = await getResult();
  if (!hooked.children) {
    return yield hooked;
  }
  for await (const children of hooked.children) {
    yield children.map(child => (
      createNode(
        Hook,
        { hook: nextHook },
        child
      )
    ));
  }
  async function getResult(): Promise<HookPair> {
    const result = await hook(node);
    if (isHookPair(result)) {
      return result;
    } else {
      return [result, hook];
    }

    function isHookPair(value: unknown): value is HookPair {
      return value === result && Array.isArray(value);
    }
  }
}
