import { TestStartup } from "@ipare/testing";
import "../src";
import { getEnv } from "./utils";

describe("env", () => {
  it("should load env with empty options", async () => {
    const env = await getEnv();
    expect(env.BNAME).toBe("BASE");
    expect(env.NAME).toBeUndefined();
    expect(env.SNAME).toBeUndefined();
  });

  it("should load env with options", async () => {
    const env = await getEnv("development", {});
    expect(env.BNAME).toBe("DEVELOPMENT");
    expect(env.NAME).toBe("DEVELOPMENT");
    expect(env.SNAME).toBe("DEV");
  });

  it("should load env with cwd", async () => {
    const startup = new TestStartup();
    process.env.NODE_ENV = "production";
    const { ctx } = await startup
      .useEnv({
        cwd: "test/envs",
        override: true,
      })
      .use((ctx) => {
        ctx.bag("env", process.env);
      })
      .run();
    const env = ctx.bag<typeof process.env>("env");

    expect(env.BNAME).toBe("PRODUCTION");
    expect(env.NAME).toBe("PRODUCTION");
    expect(env.SNAME).toBe("PROD");
  });
});

describe("debug", () => {
  it("should load env with debug value true", async () => {
    const env = await getEnv("stage", {
      debug: true,
    });
    expect(env.NAME).toBe("STAGE");
  });
});
