import { Startup } from "@ipare/core";
import winston from "winston";
import Transport from "winston-transport";
import { FileTransportOptions } from "winston/lib/winston/transports";
import { OPTIONS_IDENTITY } from "./constant";
import { Options } from "./options";

declare module "@ipare/core" {
  interface Startup {
    useLogger(options?: Options): this;
    useConsoleLogger(options?: Omit<Options, "transports">): this;
    useFileLogger(
      options: Omit<Options, "transports"> & {
        fileTransportOptions: FileTransportOptions;
      }
    ): this;
  }
}

Startup.prototype.useLogger = function (options?: Options): Startup {
  return this.useInject().inject(
    OPTIONS_IDENTITY + (options?.identity ?? ""),
    () => winston.createLogger(options),
    options?.injectType
  );
};

Startup.prototype.useConsoleLogger = function (options: Options = {}): Startup {
  options.transports = new winston.transports.Console();
  return this.useLogger(options);
};

Startup.prototype.useFileLogger = function (
  options: Options & { fileTransportOptions: FileTransportOptions }
): Startup {
  options.transports = new winston.transports.File(
    options.fileTransportOptions
  );
  return this.useLogger(options);
};

export { winston, Transport };
export { Logger } from "./decorators";
export { Options } from "./options";
