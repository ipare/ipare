import "@ipare/inject";
import { Startup, Context } from "@ipare/core";
import { OPTIONS, USED } from "./constant";
import { JwtOptions } from "./jwt-options";
import { JwtService } from "./jwt.service";
import { parseInject } from "@ipare/inject";
import * as jwt from "jsonwebtoken";

export { JwtObject, JwtPayload, JwtToken } from "./decorators";
export {
  JwtOptions,
  JwtVerifyOptions,
  JwtSignOptions,
  JwtSecretRequestType,
} from "./jwt-options";
export { JwtService };

declare module "@ipare/core" {
  interface Context {
    get jwtToken(): string;
  }
}
declare module "@ipare/core" {
  interface Startup {
    useJwt(options: JwtOptions): this;
    useJwtVerify(
      skip?: (ctx: Context) => boolean | Promise<boolean>,
      onError?: (ctx: Context, err: jwt.VerifyErrors) => void | Promise<void>
    ): this;
    useJwtExtraAuth(access: (ctx: Context) => boolean | Promise<boolean>): this;
  }
}

Startup.prototype.useJwtVerify = function (
  skip?: (ctx: Context) => boolean | Promise<boolean>,
  onError?: (ctx: Context, err: jwt.VerifyErrors) => void | Promise<void>
) {
  return this.use(async (ctx, next) => {
    if (skip && (await skip(ctx))) {
      await next();
      return;
    }

    const jwtService = await parseInject(ctx, JwtService);
    try {
      await jwtService.verify();
      await next();
    } catch (err) {
      const error = err as jwt.VerifyErrors;
      if (onError) {
        await onError(ctx, error);
      } else if ("unauthorizedMsg" in ctx) {
        ctx["unauthorizedMsg"](error.message);
      } else {
        throw err;
      }
    }
  });
};

Startup.prototype.useJwtExtraAuth = function (
  access: (ctx: Context) => boolean | Promise<boolean>
) {
  return this.use(async (ctx, next) => {
    if (await access(ctx)) {
      await next();
    } else if (
      "unauthorizedMsg" in ctx &&
      "res" in ctx &&
      ctx["res"].status == 404 &&
      ctx["res"].body == undefined
    ) {
      ctx["unauthorizedMsg"]("JWT validation failed");
    }
  });
};

Startup.prototype.useJwt = function (options: JwtOptions) {
  if (this[USED]) {
    return this;
  }
  this[USED] = true;

  return this.useInject()
    .inject(JwtService)
    .use(async (ctx, next) => {
      ctx[OPTIONS] = options;

      Object.defineProperty(ctx, "jwtToken", {
        configurable: false,
        enumerable: false,
        get: () => {
          if (options.tokenProvider) {
            return options.tokenProvider(ctx);
          } else if ("req" in ctx) {
            return ctx["req"].get("Authorization");
          }
        },
      });

      await next();
    });
};
