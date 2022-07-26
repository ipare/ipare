import { Context, Request, Response } from "@ipare/core";
import { MicroMqttStartup, MicroMqttOptions } from "@ipare/micro-mqtt";
import { initBaseTestStartup, ITestStartup } from "../test-startup";

export class TestMicroMqttStartup extends MicroMqttStartup {
  constructor(options?: MicroMqttOptions) {
    super(options);
    initBaseTestStartup(this);
  }

  protected async invoke(ctx: Request | Context): Promise<Response> {
    return await super.invoke(ctx);
  }
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface TestMicroMqttStartup extends ITestStartup {}
