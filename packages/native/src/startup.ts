import * as net from "net";
import { BodyPraserStartup } from "@ipare/body";
import * as http from "http";
import * as https from "https";
import { Request, Response, Dict, isString, Context } from "@ipare/core";
import { NumericalHeadersDict } from "@ipare/http";
import urlParse from "url-parse";
import { Stream } from "stream";

const defaultPort = 2333;

type HttpNativeOptions = http.ServerOptions;
type HttpsNativeOptions = https.ServerOptions & { https: true };
type ServerType<T extends HttpNativeOptions | HttpsNativeOptions> =
  T extends HttpNativeOptions ? http.Server : https.Server;

export class NativeStartup<
  T extends HttpNativeOptions | HttpsNativeOptions =
    | HttpNativeOptions
    | HttpsNativeOptions
> extends BodyPraserStartup {
  readonly #server: ServerType<T>;

  public get server() {
    return this.#server;
  }

  constructor(serverOptions?: T) {
    super((ctx) => ctx.reqStream);

    if (isHttpsOptions(serverOptions)) {
      this.#server = https.createServer(serverOptions, this.#requestListener);
    } else if (serverOptions) {
      this.#server = http.createServer(
        serverOptions,
        this.#requestListener
      ) as ServerType<T>;
    } else {
      this.#server = http.createServer(this.#requestListener) as ServerType<T>;
    }
  }

  listen(
    port?: number,
    hostname?: string,
    backlog?: number,
    listeningListener?: () => void
  ): ServerType<T>;
  listen(
    port?: number,
    hostname?: string,
    listeningListener?: () => void
  ): ServerType<T>;
  listen(
    port?: number,
    backlog?: number,
    listeningListener?: () => void
  ): ServerType<T>;
  listen(port?: number, listeningListener?: () => void): ServerType<T>;
  listen(
    path: string,
    backlog?: number,
    listeningListener?: () => void
  ): ServerType<T>;
  listen(path: string, listeningListener?: () => void): ServerType<T>;
  listen(
    options: net.ListenOptions,
    listeningListener?: () => void
  ): ServerType<T>;
  listen(
    handle: any,
    backlog?: number,
    listeningListener?: () => void
  ): ServerType<T>;
  listen(handle: any, listeningListener?: () => void): ServerType<T>;
  listen(...args: any[]): ServerType<T> {
    return this.#server.listen(...args);
  }

  dynamicListen(
    port: number,
    hostname?: string,
    backlog?: number,
    listeningListener?: () => void
  ): Promise<{ port: number; server: ServerType<T> }>;
  dynamicListen(
    port?: number,
    hostname?: string,
    listeningListener?: () => void
  ): Promise<{ port: number; server: ServerType<T> }>;
  dynamicListen(
    port?: number,
    backlog?: number,
    listeningListener?: () => void
  ): Promise<{ port: number; server: ServerType<T> }>;
  dynamicListen(
    options: Omit<net.ListenOptions, "path">,
    listeningListener?: () => void
  ): Promise<{ port: number; server: ServerType<T> }>;
  async dynamicListen(
    arg0: number | net.ListenOptions = {},
    ...args: any[]
  ): Promise<{ port?: number; server: ServerType<T> }> {
    return await this.#tryListen(true, arg0, ...args);
  }

  #tryListen(first: boolean, arg0: number | net.ListenOptions, ...args: any[]) {
    function getPort() {
      let port!: number;
      if (first && process.env.IPARE_DEBUG_PORT) {
        port = Number(process.env.IPARE_DEBUG_PORT);
      } else if (typeof arg0 == "number") {
        port = arg0;
      } else {
        if (!arg0.port && first) {
          port = defaultPort;
        } else {
          port = arg0.port as number;
        }
      }

      const nextPort = port + 1;
      let next!: number | net.ListenOptions;
      if (typeof arg0 == "number") {
        next = nextPort;
      } else {
        next = { ...arg0, port: nextPort };
      }

      return { port, next };
    }

    function getArg0(port: number) {
      if (typeof arg0 == "number") {
        return port;
      } else {
        return {
          ...arg0,
          port: port,
        };
      }
    }

    return new Promise<{ port: number; server: ServerType<T> }>(
      (resolve, reject) => {
        let error = false;
        let listen = false;
        const { port, next } = getPort();
        const server = this.#server.listen(getArg0(port), ...args);
        server.once("listening", () => {
          listen = true;
          if (error) return;
          resolve({
            port,
            server,
          });
        });
        server.once("error", (err) => {
          error = true;
          if (listen) return;

          server.close();
          if ((err as any).code == "EADDRINUSE") {
            this.#tryListen(false, next, ...args).then((svr) => {
              resolve(svr);
            });
          } else {
            reject(err);
          }
        });
      }
    );
  }

  #requestListener = async (
    reqStream: http.IncomingMessage,
    resStream: http.ServerResponse
  ): Promise<void> => {
    const url = urlParse(reqStream.url as string, true);
    const ctx = new Context(
      new Request()
        .setPath(url.pathname)
        .setMethod(reqStream.method as string)
        .setQuery(url.query as Dict<string>)
        .setHeaders(reqStream.headers as NumericalHeadersDict)
    );

    resStream.statusCode = 404;

    Object.defineProperty(ctx, "resStream", {
      get: () => resStream,
    });
    Object.defineProperty(ctx, "reqStream", {
      get: () => reqStream,
    });

    const res = await this.invoke(ctx);

    if (!resStream.writableEnded) {
      resStream.statusCode = res.status;
      this.#writeHead(res, resStream);
      this.#writeBody(res, resStream);
    }
  };

  #writeHead(ipareRes: Response, resStream: http.ServerResponse) {
    if (resStream.headersSent) return;
    Object.keys(ipareRes.headers)
      .filter((key) => !!ipareRes.headers[key])
      .forEach((key) => {
        resStream.setHeader(key, ipareRes.headers[key] as string | string[]);
      });
  }

  #writeBody(ipareRes: Response, resStream: http.ServerResponse) {
    if (!ipareRes.body) {
      resStream.end();
      return;
    }

    if (ipareRes.body instanceof Stream) {
      ipareRes.body.pipe(resStream);
    } else if (Buffer.isBuffer(ipareRes.body)) {
      resStream.end(ipareRes.body);
    } else if (isString(ipareRes.body)) {
      resStream.end(ipareRes.body);
    } else {
      resStream.end(JSON.stringify(ipareRes.body));
    }
  }
}

function isHttpsOptions(
  options?: HttpNativeOptions | HttpsNativeOptions
): options is HttpsNativeOptions {
  return !!options && "https" in options && options.https;
}
