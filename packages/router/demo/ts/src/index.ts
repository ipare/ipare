import { TestStartup } from "sfa";
import "@sfajs/router";

export const main = async (): Promise<unknown> => {
  return new TestStartup()
    .use(async (ctx, next) => {
      ctx.res.headers.demo = "ts";
      await next();
    })
    .useRouter()
    .run();
};