import { HttpContext, Middleware, SfaRequest, TestStartup } from "@sfajs/core";
import { Inject } from "@sfajs/inject";
import { Header, PipeTransform } from "../src";
import { GlobalPipeType } from "../src/global-pipe-type";

test("global pipe property", async () => {
  class TestGlobalPipe implements PipeTransform<string | number, number> {
    static index = 0;
    transform(value: string | number, ctx: HttpContext, propertyType: any) {
      TestGlobalPipe.index++;
      ctx.res["propertyKey" + TestGlobalPipe.index] = propertyType;
      ctx.res["index"] = TestGlobalPipe.index;
      return 1;
    }
  }

  @Inject
  class TestMiddleware extends Middleware {
    @Header("h1")
    private readonly h1!: string;

    async invoke(): Promise<void> {
      this.ok({
        h1: this.h1,
      });
    }
  }

  const startup = new TestStartup(new SfaRequest().setHeader("h1", "5"))
    .useInject()
    .useGlobalPipe(GlobalPipeType.before, TestGlobalPipe)
    .useGlobalPipe(GlobalPipeType.after, TestGlobalPipe)
    .add(TestMiddleware);
  const res = await startup.run();

  expect(res["propertyKey1"]).toBe(String);
  expect(res["propertyKey2"]).toBe(String);
  expect(res.body).toEqual({
    h1: 1,
  });
  expect(res.status).toBe(200);
});

test("global pipe params", async () => {
  class TestGlobalPipe implements PipeTransform<string | number, number> {
    static index = 0;
    transform(value: string | number, ctx: HttpContext, propertyType: any) {
      TestGlobalPipe.index++;
      ctx.res["propertyKey" + TestGlobalPipe.index] = propertyType;
      ctx.res["index"] = TestGlobalPipe.index;
      return 1;
    }
  }

  @Inject
  class TestMiddleware extends Middleware {
    constructor(@Header("h1") readonly h1: number) {
      super();
    }

    async invoke(): Promise<void> {
      this.ok({
        h1: this.h1,
      });
    }
  }

  const startup = new TestStartup(new SfaRequest().setHeader("h1", "5"))
    .useInject()
    .useGlobalPipe(GlobalPipeType.before, TestGlobalPipe)
    .useGlobalPipe(GlobalPipeType.after, TestGlobalPipe)
    .add(TestMiddleware);
  const res = await startup.run();

  expect(res["propertyKey1"]).toBe(Number);
  expect(res["propertyKey2"]).toBe(Number);
  expect(res.body).toEqual({
    h1: 1,
  });
  expect(res.status).toBe(200);
});