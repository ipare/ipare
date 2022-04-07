import { Middleware, TestStartup } from "@sfajs/core";
import { Service2 } from "./services";
import "../src";
import { Inject } from "../src";

@Inject
class TestMiddleware extends Middleware {
  constructor(
    private readonly service: Service2,
    private readonly num: number
  ) {
    super();
  }

  async invoke(): Promise<void> {
    this.ok({
      md: `md.${this.service?.invoke()}`,
      num: this.num,
    });
  }
}

test(`middleware constructor`, async () => {
  const res = await new TestStartup().useInject().add(TestMiddleware).run();

  expect(res.body).toEqual({
    md: "md.service2.service1",
    num: new Number(),
  });
  expect(res.status).toBe(200);
});

test(`function middleware constructor`, async () => {
  const res = await new TestStartup()
    .useInject()
    .add((ctx) => {
      ctx.setHeader("h", "1");
      return TestMiddleware;
    })
    .run();

  expect(res.body).toEqual({
    md: "md.service2.service1",
    num: new Number(),
  });
  expect(res.status).toBe(200);
  expect(res.getHeader("h")).toBe("1");
});

test(`async function middleware constructor`, async () => {
  const res = await new TestStartup()
    .useInject()
    .add(async (ctx) => {
      await new Promise<void>((resolve) => {
        setTimeout(() => resolve(), 200);
      });
      ctx.setHeader("h", "1");
      return TestMiddleware;
    })
    .run();

  expect(res.body).toEqual({
    md: "md.service2.service1",
    num: new Number(),
  });
  expect(res.status).toBe(200);
  expect(res.getHeader("h")).toBe("1");
});
