import Request from "./Request";
import Response from "./Response";
import ResultHandler from "./ResultHandler";

export default class HttpContext extends ResultHandler {
  constructor(req: Request) {
    super();
    this.#req = req;
  }

  readonly #bag: { [k: string]: unknown } = {};

  #res: Response = new Response();
  public get res(): Response {
    return this.#res;
  }

  #req: Request;
  public get req(): Request {
    return this.#req;
  }

  public bag<T>(key: string): T;
  public bag<T>(key: string, value: T): HttpContext;
  public bag<T>(key: string, builder: () => T): HttpContext;
  public bag<T>(key: string, value?: T | (() => T)): HttpContext | T {
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
}