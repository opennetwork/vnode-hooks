import { VNode, createNode, isFragmentVNode } from "@opennetwork/vnode";

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

export type HookFnReturn = VNode | HookPair;

export interface HookFn {
  (node: VNode): HookFnReturn | Promise<HookFnReturn>;
}

export interface HookOptions {
  hook: HookFn;
  depth?: number;
  mutate?: boolean;
}

const HookedMap = new WeakMap<HookFn, WeakSet<VNode>>();
function getHookedSet(hook: HookFn): WeakSet<VNode> {
  const existing = HookedMap.get(hook);
  if (existing) {
    return existing;
  }
  const next = new WeakSet();
  HookedMap.set(hook, next);
  return next;
}
function isHooked(hook: HookFn, node: VNode): boolean {
  return getHookedSet(hook).has(node);
}
function setHooked(hook: HookFn, node: VNode) {
  getHookedSet(hook).add(node);
}

export async function Hook({ hook, depth, mutate, ...options }: HookOptions, node: VNode): Promise<VNode> {
  if (isHooked(hook, node)) {
    return node;
  }
  const [hooked, nextHook] = await getResult();
  setHooked(hook, hooked);
  if (!hooked.children) {
    return hooked;
  } else if (mutate) {
    return {
      ...hooked,
      children: {
        [Symbol.asyncIterator]() {
          return hookChildren(hooked);
        }
      }
    };
  } else {
    return new Proxy(hooked, {
      get(target, prop: keyof VNode) {
        if (prop === "children") {
          return hookChildren(target);
        }
        return target[prop];
      }
    });
  }
  async function *hookChildren(hooked: VNode): AsyncIterable<VNode[]> {
    for await (const children of hooked.children) {
      yield children.map(child => (
        createNode(Hook({ hook: nextHook, depth: (depth || 0) + 1 }, child))
      ));
    }
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
