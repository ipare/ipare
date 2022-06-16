import { HttpContext } from "@sfajs/core";
import { InjectType } from "../inject-type";

export interface InjectCustom<T = any> {
  readonly handler: (ctx?: HttpContext) => T | Promise<T>;
  readonly property: string | symbol;
  readonly parameterIndex?: number;
  readonly type?: InjectType;
}