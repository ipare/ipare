import HeadersHandler, { HeaderValueType } from "../HeadersHandler";
import HttpMethod from "./HttpMethod";

export default class Request extends HeadersHandler {
  constructor() {
    super(() => this.#headers);
  }

  #headers: NodeJS.Dict<HeaderValueType> = {};

  get headers(): NodeJS.ReadOnlyDict<HeaderValueType> {
    return this.#headers;
  }

  #body: unknown;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public get body(): any {
    return this.#body;
  }

  #path = "";
  public get path(): string {
    return this.#path;
  }

  public get overrideMethod(): string | undefined {
    if (
      this.#method &&
      this.#method.toUpperCase() != this.method.toUpperCase()
    ) {
      return this.#method;
    }
  }

  #method = HttpMethod.any;
  public get method(): string {
    const ovrdHeaderKey = "X-HTTP-Method-Override";
    const ovrdKey = Object.keys(this.#headers).filter(
      (h) => h.toUpperCase() == ovrdHeaderKey.toUpperCase()
    )[0];
    if (ovrdKey) {
      const ovrdValue = this.#headers[ovrdKey];
      if (ovrdValue && typeof ovrdValue == "string") {
        return ovrdValue.toUpperCase();
      } else if (ovrdValue && Array.isArray(ovrdValue) && ovrdValue.length) {
        return ovrdValue[0].toUpperCase();
      }
    }
    return this.#method;
  }

  setPath(path: string): Request {
    if (!!path && (path.startsWith("/") || path.startsWith("\\"))) {
      this.#path = path.substr(1, path.length - 1);
    } else {
      this.#path = path;
    }
    return this;
  }

  setMethod(method: string): Request {
    this.#method = method?.toUpperCase();
    return this;
  }

  setBody(body: unknown): Request {
    this.#body = body;
    return this;
  }

  #query: NodeJS.Dict<string> = {};
  get query(): NodeJS.ReadOnlyDict<string> {
    return this.#query;
  }
  setQuery(key: string, value?: string): Request;
  setQuery(query: NodeJS.Dict<string>): Request;
  setQuery(key: string | NodeJS.Dict<string>, value?: string): Request {
    if (typeof key == "string") {
      this.#query[key] = value;
    } else {
      Object.assign(this.#query, key);
    }
    return this;
  }
}
