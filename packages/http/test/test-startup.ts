import { Response, Request, Context } from "@ipare/core";
import { HttpStartup } from "../src";
import { initCatchError } from "../src/context";

declare module "@ipare/core" {
  interface Context {
    initCatchError(): this;
  }
}

export class TestStartup extends HttpStartup {
  readonly #req?: Request;
  constructor(req?: Request) {
    super();
    this.#req = req;

    Context.prototype.initCatchError = function () {
      initCatchError(this);
      return this;
    };
  }

  async run(): Promise<Response> {
    return await super.invoke(this.#req ?? new Context());
  }
}
