import { Request } from "@ipare/core";
import { TestHttpStartup } from "@ipare/testing/dist/http";
import "../src";
import { FILE_404_BAG, FILE_BAG } from "../src/constant";
import { readStream } from "./utils";

test("not found", async () => {
  const result = await new TestHttpStartup()
    .setContext(new Request().setMethod("get").setPath("not-exist"))
    .useStatic({
      dir: "test/static",
      encoding: "utf-8",
    })
    .run();
  expect(result.status).toBe(404);
});

test("404 page", async () => {
  {
    const result = await new TestHttpStartup()
      .setContext(new Request().setMethod("get").setPath("not-exist"))
      .use(async (ctx, next) => {
        await next();
        expect(ctx.bag<string>(FILE_BAG)).not.toBeUndefined();
        expect(ctx.bag<boolean>(FILE_404_BAG)).toBeTruthy();
      })
      .useStatic({
        dir: "test/static",
        encoding: "utf-8",
        file404: true,
      })
      .run();
    expect(result.status).toBe(404);
    expect(await readStream(result.body)).toBe("404 page");
  }
  {
    const result = await new TestHttpStartup()
      .setContext(new Request().setMethod("get").setPath("not-exist"))
      .useStatic({
        dir: "test/static",
        encoding: "utf-8",
        file404: "404.html",
      })
      .run();
    expect(result.status).toBe(404);
    expect(await readStream(result.body)).toBe("404 page");
  }
});

test("404 page not found", async () => {
  const result = await new TestHttpStartup()
    .setContext(new Request().setMethod("get").setPath("not-exist"))
    .useStatic({
      dir: "test/static",
      encoding: "utf-8",
      file404: "4044.html",
    })
    .run();
  expect(result.status).toBe(404);
  expect(result.body).toBe(undefined);
});
