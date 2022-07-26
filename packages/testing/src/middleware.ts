import {
  HookType,
  Context,
  Middleware,
  ObjectConstructor,
  Startup,
} from "@ipare/core";

export type TestMiddlewareFn<T extends Middleware> = (
  md: T,
  ctx: Context
) => void | Promise<void>;

export type ExpectMiddlewareType =
  | HookType.BeforeInvoke
  | HookType.AfterInvoke
  | HookType.BeforeNext;

declare module "@ipare/core" {
  interface Startup {
    expectMiddleware<T extends Middleware>(
      mdCls: ObjectConstructor<T>,
      fn: TestMiddlewareFn<T>,
      type?: ExpectMiddlewareType
    ): this;
  }
}

Startup.prototype.expectMiddleware = function <T extends Middleware>(
  middleware: ObjectConstructor<T>,
  expect: TestMiddlewareFn<T>,
  type: ExpectMiddlewareType = HookType.BeforeInvoke
) {
  const key = "";
  return this.use(async (ctx, next) => {
    await next();
    if (!ctx.bag(key)) {
      throw new Error("The middleware is not executed!");
    }
  }).hook(type as any, async (ctx, md: T) => {
    if (md.constructor == middleware) {
      ctx.bag(key, true);
      await expect(md, ctx);
    }
  });
};
