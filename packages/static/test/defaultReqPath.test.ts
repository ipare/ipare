import { TestStartup, Request } from "@ipare/core";
import "../src";

test("default req path not found", async function () {
  const result = await new TestStartup(
    new Request().setMethod("get").setPath("ind")
  )
    .useStatic({
      file: "test/static/index.html",
    })
    .run();
  expect(result.status).toBe(404);
});

test("default req path found", async function () {
  {
    const result = await new TestStartup(
      new Request().setMethod("get").setPath("test/static/index.html")
    )
      .useStatic({
        file: "test/static/index.html",
      })
      .run();
    expect(result.status).toBe(200);
  }
  {
    const result = await new TestStartup(
      new Request().setMethod("get").setPath("test/static/index.html/")
    )
      .useStatic({
        file: "test/static/index.html",
      })
      .run();
    expect(result.status).toBe(200);
  }
});
