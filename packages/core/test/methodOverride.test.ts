import { HttpMethod, Startup, StatusCode } from "../src/index";
import Request from "../src/Request";

test("method override", async function () {
  const req = new Request()
    .setMethod(HttpMethod.patch.toUpperCase())
    .setHeader("X-HTTP-Method-Override", "POST");
  expect(req.method).toBe(HttpMethod.post);
  expect(req.method).not.toBe(HttpMethod.patch);
});

test("method override upper case", async function () {
  const req = new Request()
    .setMethod(HttpMethod.patch.toUpperCase())
    .setHeader("X-HTTP-METHOD-OVERRIDE", "POST");
  expect(req.method).toBe(HttpMethod.post);
  expect(req.method).not.toBe(HttpMethod.patch);
});

test(`method override request`, async function () {
  const result = await new Startup(
    new Request().setMethod(HttpMethod.patch.toUpperCase())
  )
    .use(async (ctx) => {
      ctx.res.status = StatusCode.ok;
      ctx.res.body = {
        method: HttpMethod.get,
      };
    })
    .invoke();

  expect(result.status).toBe(200);
  expect((result.body as Record<string, unknown>).method).toBe(HttpMethod.get);
});
