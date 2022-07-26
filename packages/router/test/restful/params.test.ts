import { HttpMethods } from "@ipare/methods";
import { Request } from "@ipare/core";
import { TestHttpStartup } from "@ipare/testing/dist/http";
import "../../src";
import "../utils-http";

test(`restful params test1`, async () => {
  const res = await new TestHttpStartup()
    .setContext(new Request().setPath("/restful/45").setMethod(HttpMethods.get))
    .useTestRouter()
    .run();
  expect(res.body).toEqual({
    id1: "45",
    id2: "45",
    method: "GET",
  });
  expect(res.status).toBe(200);
});

test(`restful params test2`, async () => {
  const res = await new TestHttpStartup()
    .setContext(
      new Request().setPath("/restful/11/animals").setMethod(HttpMethods.get)
    )
    .useTestRouter()
    .run();

  expect(res.body).toEqual({
    id: "11",
    method: "GET",
  });
  expect(res.status).toBe(200);
});

test(`get params one object`, async () => {
  const res = await new TestHttpStartup()
    .setContext(new Request().setPath("/restful/45").setMethod(HttpMethods.get))
    .use(async (ctx, next) => {
      expect(ctx.req.params).toBe(ctx.req.params);
      await next();
    })
    .useTestRouter()
    .run();
  expect(res.status).toBe(200);
});
