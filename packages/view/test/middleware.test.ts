import { Middleware } from "@ipare/core";
import { TestStartup } from "@ipare/testing";
import "../src";

describe("middleware", () => {
  it("should not render empty string", async () => {
    class Md extends Middleware {
      async invoke(): Promise<void> {
        this.ctx.bag("view", await this.ctx.view(""));
      }
    }

    const { ctx } = await new TestStartup()
      .useView()
      .add(() => new Md())
      .run();

    expect(ctx.bag("view")).toBeUndefined();
  });

  it("should set views dir", async () => {
    class Md extends Middleware {
      async invoke(): Promise<void> {
        this.ctx.bag("view", await this.ctx.view(""));
      }
    }

    const { ctx } = await new TestStartup()
      .useView({
        dir: "test/views",
      })
      .add(() => new Md())
      .run();

    expect(ctx.bag("view")).toBeUndefined();
  });
});
