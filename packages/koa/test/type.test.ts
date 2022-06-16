import "../src";
import { TestStartup } from "@sfajs/core";
import Koa from "koa";

test("arr header type", async function () {
  const res = await new TestStartup()
    .useKoa(
      new Koa().use(async (ctx, next) => {
        ctx.body = "sfa";
        ctx.status = 200;
        ctx.set("Content-Type", ["text/plain", "charset=utf-8"]);
        await next();
      })
    )
    .run();

  expect(res.status).toBe(200);
  expect(res.body).toBe("sfa");
  expect(res.getHeader("content-type")).toEqual([
    "text/plain",
    "charset=utf-8",
  ]);
});

test("without type", async function () {
  const res = await new TestStartup()
    .useKoa(
      new Koa().use(async (ctx, next) => {
        ctx.body = "sfa";
        ctx.status = 200;
        ctx.set("Content-Type", "");
        await next();
      })
    )
    .run();

  expect(res.status).toBe(200);
  expect(res.body).toBe("sfa");
  expect(res.getHeader("content-type")).toBe("text/plain; charset=utf-8");
});