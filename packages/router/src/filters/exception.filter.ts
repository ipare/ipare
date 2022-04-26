import { HttpContext, HttpException } from "@sfajs/core";
import { Filter } from "./filter";

export interface ExceptionFilter<T extends Error = HttpException>
  extends Filter {
  onException(ctx: HttpContext, error: T): boolean | Promise<boolean>;
}
