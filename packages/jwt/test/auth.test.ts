import { TestStartup } from "@ipare/testing";
import { parseInject } from "@ipare/inject";
import "../src";
import { JwtService } from "../src";
import { createTestContext } from "./utils";

beforeEach(() => {
  process.env.IPARE_ENV = "" as any;
});

describe("auth", () => {
  function runAuthTest(auth: boolean) {
    it(`should auth ${auth}`, async function () {
      const { ctx } = await new TestStartup()
        .use(async (ctx, next) => {
          ctx.bag("result", false);
          await next();
        })
        .setContext(
          await createTestContext({
            secret: "secret",
          })
        )
        .useJwt({
          secret: "secret",
        })
        .useJwtExtraAuth(() => auth)
        .use((ctx) => ctx.bag("result", true))
        .run();
      expect(ctx.bag("result")).toBe(auth);
    });
  }
  runAuthTest(true);
  runAuthTest(false);

  it("should set 401 when use useJwtVerify in http", async () => {
    process.env.IPARE_ENV = "http";
    const { ctx } = await new TestStartup()
      .setContext(
        await createTestContext({
          secret: "secret",
        })
      )
      .use(async (ctx, next) => {
        ctx["unauthorizedMsg"] = (msg) => {
          ctx.bag("msg", msg);
        };
        await next();
      })
      .useJwt({
        secret: "secret1",
      })
      .useJwtVerify()
      .run();
    expect(ctx.bag("msg")).toBe("invalid signature");
  });

  it("should set 401 when use useJwtExtraAuth in http", async () => {
    process.env.IPARE_ENV = "http";
    const { ctx } = await new TestStartup()
      .setContext(
        await createTestContext({
          secret: "secret",
        })
      )
      .use(async (ctx, next) => {
        ctx["unauthorizedMsg"] = (msg: string) => {
          ctx.bag("msg", msg);
        };
        ctx.res["status"] = 404;
        await next();
      })
      .useJwt({
        secret: "secret",
      })
      .useJwtExtraAuth(() => false)
      .run();
    expect(ctx.bag("msg")).toBe("JWT validation failed");
  });

  it("should throw error when use useJwtVerify without env", async () => {
    process.env.IPARE_ENV = "" as any;
    const startup = new TestStartup()
      .setContext(
        await createTestContext({
          secret: "secret",
        })
      )
      .useJwt({
        secret: "secret",
      })
      .useJwtVerify();

    let err = false;
    try {
      await startup.run();
    } catch {
      err = true;
    }
    expect(err).toBeTruthy();
  });

  it(`should auth failed when use useJwtVerify in micro`, async function () {
    const startup = new TestStartup();
    const context = await createTestContext({
      secret: "secret",
    });
    process.env.IPARE_ENV = "micro";
    const { ctx } = await startup
      .setContext(context)
      .useJwt({
        secret: "secret",
      })
      .useJwtVerify()
      .run();

    expect(ctx.res["error"].message).toBe("jwt must be provided");
  });

  it(`should auth success with empty body and default verify when use micro`, async function () {
    process.env.IPARE_ENV = "micro";
    const testCtx = await createTestContext({
      secret: "secret",
    });
    testCtx.req.setBody({
      token: testCtx.req["headers"]["Authorization"],
    });

    const { ctx } = await new TestStartup()
      .setContext(testCtx)
      .useJwt({
        secret: "secret",
      })
      .useJwtVerify()
      .use((ctx) => ctx.bag("result", true))
      .run();
    expect(ctx.bag("result")).toBe(true);
  });

  it(`should auth failed with custom status when use micro`, async function () {
    process.env.IPARE_ENV = "micro";
    const { ctx } = await new TestStartup()
      .setContext(
        await createTestContext({
          secret: "secret",
        })
      )
      .useJwt({
        secret: "secret",
      })
      .useJwtExtraAuth(async (ctx) => {
        ctx.bag("extra", true);
        return false;
      })
      .use((ctx) => ctx.bag("extra", false))
      .run();
    expect(ctx.bag("extra")).toBeTruthy();
  });

  it(`should auth with null token`, async function () {
    const { ctx } = await new TestStartup()
      .useJwt({
        secret: "secret",
      })
      .use(async (ctx) => {
        const jwtService = await parseInject(ctx, JwtService);
        try {
          await jwtService.verify(null as any);
          ctx.bag("result", false);
        } catch (ex) {
          ctx.bag("result", true);
        }
      })
      .run();
    expect(ctx.bag("result")).toBeTruthy();
  });
});
