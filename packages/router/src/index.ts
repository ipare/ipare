import "sfa";
import { HttpContext, SfaTypes, Startup, status } from "sfa";
import Action from "./Action";
import MapParser from "./Map/MapParser";
import path = require("path");
import Constant from "./Constant";
import MapItem from "./Map/MapItem";

export { Action, MapItem };

declare module "sfa" {
  interface Startup {
    useRouter<T extends this>(): T;
    useRouterParser<T extends this>(dir?: string, strict?: boolean): T;
  }

  interface Request {
    readonly params: SfaTypes.ReadonlyQueryDict;
  }

  interface HttpContext {
    readonly actionPath: string;
    readonly actionRoles: string[];
    readonly routerMap: MapItem[];
    readonly routerDir: string;
    readonly routerStrict: boolean;
  }
}

Startup.prototype.useRouter = function <T extends Startup>(): T {
  return this.use(async (ctx, next) => {
    if (ctx.routerDir == undefined) {
      setConfig(ctx, Constant.defaultRouterDir, Constant.defaultStrict);
    }
    if (!ctx.actionPath) {
      if (!parseRouter(ctx)) return;
    }
    await next();
  }).add((ctx) => {
    const filePath = path.join(process.cwd(), ctx.routerDir, ctx.actionPath);
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const actionClass = require(filePath).default;
    return new actionClass() as Action;
  });
};

Startup.prototype.useRouterParser = function <T extends Startup>(
  dir = Constant.defaultRouterDir,
  strict = Constant.defaultStrict
): T {
  return useRouterParser(this, dir, strict) as T;
};

function useRouterParser<T extends Startup>(
  startup: T,
  dir: string,
  strict: boolean
): T {
  return startup.use(async (ctx, next) => {
    setConfig(ctx, dir, strict);
    if (!ctx.actionPath) {
      if (!parseRouter(ctx)) return;
    }
    await next();
  });
}

function setConfig(ctx: HttpContext, dir: string, strict: boolean) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (ctx as any).routerDir = dir;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (ctx as any).routerStrict = strict;
}

function parseRouter(ctx: HttpContext): boolean {
  const mapParser = new MapParser(ctx, ctx.routerDir, ctx.routerStrict);
  if (mapParser.notFound) {
    ctx.notFoundMsg({
      message: `Can't find the path：${ctx.req.path}`,
      path: ctx.req.path,
    });
    return false;
  }
  if (mapParser.methodNotAllowed) {
    ctx.res.body = {
      message: `method not allowed：${ctx.req.method}`,
      method: ctx.req.method,
      path: ctx.req.path,
    };
    ctx.res.status = status.StatusCodes.METHOD_NOT_ALLOWED;
    return false;
  }
  const mapItem = mapParser.mapItem;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (ctx as any).actionPath = mapItem.path;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (ctx as any).actionRoles = mapItem.roles;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (ctx as any).routerMap = mapParser.map;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (ctx.req as any).params = {};

  if (mapItem.path.includes("^")) {
    const reqPath = ctx.req.path;
    const mapPathStrs = mapItem.path.split("/");
    const reqPathStrs = reqPath.split("/");
    for (let i = 0; i < Math.min(mapPathStrs.length, reqPathStrs.length); i++) {
      const mapPathStr = mapPathStrs[i];
      if (!mapPathStr.startsWith("^")) continue;
      const reqPathStr = reqPathStrs[i];

      const key = mapPathStr.substr(1, mapPathStr.length - 1);
      const value = decodeURIComponent(reqPathStr);

      const params = ctx.req.params as SfaTypes.QueryDict;
      params[key] = value;
    }
  }

  return true;
}
