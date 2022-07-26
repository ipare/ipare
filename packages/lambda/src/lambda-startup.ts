import { HeadersDict } from "@ipare/http";
import { HttpMethods } from "@ipare/methods";
import { ResponseStruct } from "./response-struct";
import { Readable } from "stream";
import { HttpStartup } from "@ipare/http";
import { Context, Dict, isObject, Request } from "@ipare/core";

export class LambdaStartup extends HttpStartup {
  async run(event: Dict, context: Dict): Promise<ResponseStruct> {
    const ctx = this.createContext(event, context);
    await super.invoke(ctx);
    return await this.#getStruct(ctx);
  }

  private createContext(event: Dict, context: Dict): Context {
    const ctx = new Context(
      new Request()
        .setBody(this.#getBody(event))
        .setMethod(
          event.httpMethod ||
            event.method ||
            event.requestContext?.http?.method ||
            HttpMethods.get
        )
        .setHeaders(event.headers ?? {})
        .setQuery(event.queryStringParameters ?? event.query ?? {})
        .setPath(
          event.path || event.rowPath || event.requestPath || event.url || ""
        )
    );

    this.#defineCtxProperty(ctx, event, context);
    return ctx;
  }

  #defineCtxProperty(ctx: Context, event: Dict, context: Dict) {
    Object.defineProperty(ctx.req, "lambdaContext", {
      configurable: false,
      enumerable: false,
      get: () => context,
    });

    Object.defineProperty(ctx.req, "lambdaEvent", {
      configurable: false,
      enumerable: false,
      get: () => event,
    });

    Object.defineProperty(ctx, "lambdaContext", {
      configurable: false,
      enumerable: false,
      get: () => context,
    });

    Object.defineProperty(ctx, "lambdaEvent", {
      configurable: false,
      enumerable: false,
      get: () => event,
    });
  }

  async #getStruct(ctx: Context): Promise<ResponseStruct> {
    let body = ctx.res.body;
    let isBase64Encoded = false;
    if (Buffer.isBuffer(body)) {
      isBase64Encoded = true;
      body = body.toString("base64");
    } else if (body instanceof Readable) {
      isBase64Encoded = true;
      body = await this.#readSteram(body);
    } else if (isObject(body)) {
      body = JSON.stringify(body);
    }

    return {
      headers: ctx.res.headers,
      statusCode: ctx.res.status,
      status: ctx.res.status,
      isBase64Encoded: isBase64Encoded,
      body: body ?? "",
    };
  }

  async #readSteram(stream: Readable): Promise<string> {
    const chunks: Buffer[] = [];
    await new Promise<void>((resolve, reject) => {
      stream.on("data", (chunk) => {
        const encoding = stream.readableEncoding ?? undefined;
        if (Buffer.isBuffer(chunk)) {
          chunks.push(chunk);
        } else {
          chunks.push(Buffer.from(chunk, encoding));
        }
      });
      stream.on("end", () => {
        resolve();
      });
      stream.on("error", (err) => {
        reject(err);
      });
    });
    return Buffer.concat(chunks).toString("base64");
  }

  #getBody(event: Dict): any {
    const body = event.body;
    const headers = event.headers as HeadersDict;
    if (typeof body == "string") {
      if (event.isBase64Encoded) {
        return Buffer.from(body, "base64");
      } else if (
        headers &&
        headers["content-type"]?.includes("application/json")
      ) {
        return JSON.parse(body);
      }
    }

    return body ?? {};
  }
}
