import { HttpMethod, Middleware } from "sfa";
import { SingleStaticConfig, StaticConfig } from "./StaticConfig";

export abstract class BaseMiddleware extends Middleware {
  readonly cfg!: StaticConfig | SingleStaticConfig;

  private get isMethodValid(): boolean {
    if (!this.cfg.method) {
      return this.ctx.req.method == HttpMethod.get;
    }
    if (Array.isArray(this.cfg.method)) {
      const methods = this.cfg.method.map((m) => m.toUpperCase());
      return (
        methods.includes(HttpMethod.any) ||
        methods.includes(this.ctx.req.method)
      );
    } else {
      if (this.cfg.method.toUpperCase() == HttpMethod.any) return true;
      if (this.ctx.req.method == this.cfg.method.toUpperCase()) return true;
      return false;
    }
  }

  private get isPathValid(): boolean {
    if ((this.ctx.req.path ?? "").includes("..")) {
      return false;
    } else {
      return true;
    }
  }

  protected get isReqValida(): boolean {
    return this.isMethodValid && this.isPathValid;
  }
}
