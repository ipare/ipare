import { SfaRequest } from "./sfa-request";
import { SfaResponse } from "./sfa-response";
import { ResultHandler } from "./result-handler";
import { HttpException, InternalServerErrorException } from "../exceptions";
import { isNil, isObject, Dict } from "../utils";

export class HttpContext extends ResultHandler {
  constructor(req: SfaRequest) {
    super(() => this.#res);
    this.#req = req;
  }

  readonly #bag: Dict = {};

  readonly #res = new SfaResponse();
  public get res(): SfaResponse {
    return this.#res;
  }

  readonly #req: SfaRequest;
  public get req(): SfaRequest {
    return this.#req;
  }

  public bag<T>(key: string): T;
  public bag<T>(key: string, value: T): this;
  public bag<T>(key: string, builder: () => T): this;
  public bag<T>(key: string, value?: T | (() => T)): this | T {
    if (value == undefined) {
      const result = this.#bag[key];
      if (typeof result == "function") {
        return result();
      } else {
        return result as T;
      }
    } else {
      this.#bag[key] = value;
      return this;
    }
  }

  public catchError(err: HttpException | Error | any): this {
    if (err instanceof HttpException) {
      this.setHeaders(err.header.headers)
        .res.setStatus(err.status)
        .setBody(err.toPlainObject());
    } else if (err instanceof Error) {
      const msg = err.message || undefined;
      this.catchError(new InternalServerErrorException(msg));
    } else if (isObject(err)) {
      this.catchError(new InternalServerErrorException(err));
    } else {
      const error = (!isNil(err) && String(err)) || undefined;
      this.catchError(new InternalServerErrorException(error));
    }
    return this;
  }
}