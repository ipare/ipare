import { MicroStartup } from "@ipare/micro";
import { MicroRedisOptions } from "./options";
import { Context, getIparePort } from "@ipare/core";
import type redis from "redis";
import { parseJsonBuffer } from "@ipare/micro-common";

export class MicroRedisStartup extends MicroStartup {
  constructor(protected readonly options: MicroRedisOptions = {}) {
    super();
  }

  #handlers: {
    pattern: string;
    handler: (ctx: Context) => Promise<void> | void;
  }[] = [];

  protected pub?: redis.RedisClientType;
  protected sub?: redis.RedisClientType;

  async listen() {
    await this.close();

    const opt: MicroRedisOptions = { ...this.options };
    if (!("url" in opt)) {
      const port = getIparePort(6379);
      opt.url = `redis://localhost:${port}`;
    }

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const redisPkg = require("redis");
    const pub = redisPkg.createClient(opt) as redis.RedisClientType;
    const sub = redisPkg.createClient(opt) as redis.RedisClientType;

    this.pub = pub;
    this.sub = sub;
    await Promise.all([pub.connect(), sub.connect()]);

    this.#handlers.forEach((item) => {
      this.#pattern(item.pattern, item.handler);
    });

    this.logger.info(`Server started, listening url: ${opt.url}`);
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
          parseJsonBuffer(buffer),
          async ({ result, req }) => {
            await this.pub?.publish(
              pattern + "." + req.id,
              JSON.stringify(result)
            );
          },
          handler
        );
      },
      true
    );
    return this;
  }

  pattern(pattern: string, handler: (ctx: Context) => Promise<void> | void) {
    this.logger.debug(`Add pattern: ${pattern}`);
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
    async function disconnect(redis?: redis.RedisClientType) {
      if (redis?.isReady && redis.isOpen) {
        await redis.quit();
      }
    }
    await disconnect(this.pub);
    this.pub = undefined;
    await disconnect(this.sub);
    this.sub = undefined;
    this.logger.info("Server shutdown success");
  }
}
