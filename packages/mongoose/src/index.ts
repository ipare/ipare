import "@ipare/core";
import { Context, Startup } from "@ipare/core";
import { IService, parseInject } from "@ipare/inject";
import mongoose from "mongoose";
import { OPTIONS_IDENTITY } from "./constant";
import { Options } from "./options";

export type MongooseConnection = mongoose.Connection;

declare module "@ipare/core" {
  interface Startup {
    useMongoose(options: Options): this;
  }

  interface Context {
    getMongoose(identity?: string): Promise<MongooseConnection>;
  }
}

Startup.prototype.useMongoose = function (options: Options): Startup {
  const injectKey = OPTIONS_IDENTITY + (options.identity ?? "");

  return this.useInject().inject(
    injectKey,
    async () => {
      const opt = { ...options } as Partial<Options>;
      delete opt.url;
      delete opt.injectType;
      delete opt.identity;
      const connection = await mongoose.createConnection(options.url, opt);
      const disposedClient = connection as IService & typeof connection;
      disposedClient.dispose = async () => {
        if (
          disposedClient.readyState == mongoose.ConnectionStates.connected ||
          disposedClient.readyState == mongoose.ConnectionStates.connecting
        ) {
          await disposedClient.destroy();
        }
      };
      return connection;
    },
    options.injectType
  );
};

Context.prototype.getMongoose = async function (
  identity?: string
): Promise<MongooseConnection> {
  const injectKey = OPTIONS_IDENTITY + (identity ?? "");
  return (await parseInject(this, injectKey)) as MongooseConnection;
};

export { mongoose };
export { Mongoose } from "./decorators";
export { Options } from "./options";
