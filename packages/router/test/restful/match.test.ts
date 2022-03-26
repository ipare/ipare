import "../../src";
import { TestStartup, SfaRequest, HttpContext } from "@sfajs/core";
import { HttpMethod } from "@sfajs/common";
import { routerCfg } from "../global";

test(`find next`, async function () {
  const result = await new TestStartup(
    new SfaRequest().setPath("/restful/method").setMethod(HttpMethod.post)
  )
    .useRouter(routerCfg)
    .run();
  expect(result.status).toBe(200);
});

test(`find simple`, async function () {
  const result = await new TestStartup(
    new SfaRequest()
      .setPath("/restful/method/simple")
      .setMethod(HttpMethod.post)
  )
    .useRouter(routerCfg)
    .run();
  expect(result.status).toBe(200);
  expect(result.body.action).toBe("simple");
});

test(`find simple next`, async function () {
  const result = await new TestStartup(
    new SfaRequest().setPath("/restful/method/any").setMethod(HttpMethod.post)
  )
    .useRouter(routerCfg)
    .run();
  expect(result.status).toBe(200);
  expect(result.body.action).toBe("params");
});

test(`find miss next`, async function () {
  const result = await new TestStartup(
    new SfaRequest().setPath("/restful/method/miss").setMethod(HttpMethod.post)
  )
    .useRouter(routerCfg)
    .run();
  expect(result.status).toBe(200);
  expect(result.body.action).toBe("miss");
  expect(result.body.action).not.toBe("params");
});

test(`find miss next 2`, async function () {
  const result = await new TestStartup(
    new SfaRequest()
      .setPath("/restful/method/miss/any")
      .setMethod(HttpMethod.post)
  )
    .useRouter(routerCfg)
    .run();
  expect(result.status).toBe(200);
  expect(result.body.action).toBe("miss/params");
});

test(`find miss next 3`, async function () {
  const result = await new TestStartup(
    new SfaRequest()
      .setPath("/restful/method/any/miss")
      .setMethod(HttpMethod.post)
  )
    .useRouter(routerCfg)
    .run();
  expect(result.status).toBe(200);
  expect(result.body.action).toBe("params/miss");
});

test(`find miss next 4`, async function () {
  const result = await new TestStartup(
    new SfaRequest()
      .setPath("/restful/method/any/any")
      .setMethod(HttpMethod.post)
  )
    .useRouter(routerCfg)
    .run();
  expect(result.status).toBe(200);
  expect(result.body.action).toBe("params2/nextParams");
});

test(`mostLikePathParts`, async function () {
  let context!: HttpContext;
  const result = await new TestStartup(
    new SfaRequest()
      .setPath("/restful/mostLike/q/act")
      .setMethod(HttpMethod.post)
  )
    .use(async (ctx, next) => {
      context = ctx;
      await next();
    })
    .useRouter(routerCfg)
    .run();
  expect(result.status).toBe(204);
  expect(context.routerMapItem.path).toBe("restful/mostLike/^id1/act.post.ts");
});
