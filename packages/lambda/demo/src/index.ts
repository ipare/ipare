import SfaCloudbase from "@sfajs/cloudbase";
import "@sfajs/router";

export const main = async (
  event: Record<string, unknown>,
  context: Record<string, unknown>
): Promise<unknown> => {
  const startup = new SfaCloudbase(event, context)
    .use(async (ctx, next) => {
      ctx.res.headers.demo = "ts";
      await next();
    })
    .useRouter();
  return await startup.invoke();
};