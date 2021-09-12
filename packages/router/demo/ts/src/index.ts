import { TestStartup } from "sfa";
import "@sfajs/router-act";

export const main = async (): Promise<unknown> => {
  return new TestStartup()
    .use(async (ctx, next) => {
      ctx.res.setHeader("demo", "ts");
      await next();
    })
    .useRouter()
    .run();
};
