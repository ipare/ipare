import * as sfa from "sfa";
import "../src";

declare module "sfa" {
  interface Startup {
    useTest<T extends this>(config?: { dir?: string; prefix?: string }): T;
  }
}

sfa.Startup.prototype.useTest = function <T extends sfa.Startup>(
  this: sfa.Startup,
  config?: { dir?: string; prefix?: string }
): T {
  this.use(async (ctx, next) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (ctx as any).routerDir = config?.dir ?? "test/controllers";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (ctx as any).routerPrefix = config?.prefix ?? "";
    await next();
  });
  return this as T;
};
