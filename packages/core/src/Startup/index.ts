import Middleware from "../Middleware";
import Response from "../Response";
import HttpContext from "../HttpContext";
import SimpleMiddleware from "../Middleware/SimpleMiddleware";
import ResponseError from "../Response/ResponseError";
import Request from "../Request";

export default abstract class Startup {
  constructor(req?: Request) {
    this.#ctx = new HttpContext(req || new Request());
  }

  #ctx: HttpContext;
  public get ctx(): HttpContext {
    return this.#ctx;
  }

  use<T extends this>(
    builder:
      | (() => Middleware)
      | ((ctx: HttpContext, next: () => Promise<void>) => Promise<void>)
  ): T {
    if (!builder) throw new Error();

    let mdFunc;
    if (builder.length) {
      mdFunc = () => {
        return new SimpleMiddleware(
          builder as (
            ctx: HttpContext,
            next: () => Promise<void>
          ) => Promise<void>
        );
      };
    } else {
      mdFunc = builder as () => Middleware;
    }

    this.ctx.mds.push({
      builder: mdFunc,
    });

    return this as T;
  }

  protected async invoke(): Promise<Response> {
    if (!this.ctx.mds.length) {
      return this.ctx.res;
    }

    try {
      const { builder, md } = this.ctx.mds[0];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await ((md ?? builder()) as any).init(this.ctx, 0).invoke();
    } catch (err) {
      if (err instanceof ResponseError) {
        this.#handleError(err);
      } else {
        throw err;
      }
    }

    return this.ctx.res;
  }

  #handleError = function (this: Startup, err: ResponseError): void {
    if (err.status != undefined) {
      this.ctx.res.status = err.status;
    }
    if (err.body != undefined) {
      this.ctx.res.body = err.body;
    }
    Object.assign(this.ctx.res.headers, err.headers);
  };
}
