import { Middleware } from "@ipare/core";
import "../src";
import { Service2, Service3 } from "./services";
import { Inject } from "../src";
import { TestStartup } from "@ipare/testing";

class TestMiddleware extends Middleware {
  @Inject
  private readonly service2!: Service2;
  @Inject
  private readonly service3!: Service3;

  async invoke(): Promise<void> {
    this.ctx.bag("result", {
      service2: this.service2.invoke(),
      service3: this.service3.invoke(),
    });
  }
}

test(`derive`, async function () {
  const { ctx } = await new TestStartup()
    .useInject()
    .inject(Service2, Service3)
    .add(TestMiddleware)
    .run();

  expect(ctx.bag("result")).toEqual({
    service2: "service3.service2.service1",
    service3: "service3.service2.service1",
  });
});
