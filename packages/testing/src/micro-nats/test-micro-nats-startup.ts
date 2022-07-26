import { Context, Request, Response } from "@ipare/core";
import { MicroNatsOptions, MicroNatsStartup } from "@ipare/micro-nats";
import { initBaseTestStartup, ITestStartup } from "../test-startup";

export class TestMicroNatsStartup extends MicroNatsStartup {
  constructor(options?: MicroNatsOptions) {
    super(options);
    initBaseTestStartup(this);
  }

  protected async invoke(ctx: Request | Context): Promise<Response> {
    return await super.invoke(ctx);
  }
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface TestMicroNatsStartup extends ITestStartup {}
