import { MicroStartup } from "@ipare/micro";
import { MicroRedisOptions } from "./options";
import { initRedisConnection, MicroRedisConnection } from "./connection";
import { Context } from "@ipare/core";

export class MicroRedisStartup extends MicroStartup {
  constructor(protected readonly options: MicroRedisOptions = {}) {
    super();
    initRedisConnection.bind(this)();
  }

  #handlers: {
    pattern: string;
    handler: (ctx: Context) => Promise<void> | void;
  }[] = [];

  async listen() {
    await this.initClients();

    this.#handlers.forEach((item) => {
      this.#pattern(item.pattern, item.handler);
    });

    return {
      sub: this.sub,
      pub: this.pub,
    };
  }

  #pattern(pattern: string, handler: (ctx: Context) => Promise<void> | void) {
    if (!this.sub) return this;
    this.sub.subscribe(
      pattern,
      async (buffer) => {
        this.handleMessage(
          buffer,
          async ({ result, req }) => {
            await this.pub?.publish(pattern + "." + req.id, result);
          },
          handler
        );
      },
      true
    );
    return this;
  }

  pattern(pattern: string, handler: (ctx: Context) => Promise<void> | void) {
    pattern = this.prefix + pattern;
    this.#handlers.push({ pattern, handler });
    return this.#pattern(pattern, handler);
  }

  patterns(
    ...patterns: {
      pattern: string;
      handler: (ctx: Context) => Promise<void> | void;
    }[]
  ) {
    patterns.forEach((item) => {
      this.pattern(item.pattern, item.handler);
    });
    return this;
  }

  async close() {
    await this.closeClients();
  }
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface MicroRedisStartup
  extends MicroRedisConnection<MicroRedisOptions> {}
