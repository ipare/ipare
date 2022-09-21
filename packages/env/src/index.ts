import { Startup } from "@ipare/core";
import { EnvOptions } from "./options";
import { useEnv } from "./use-env";

declare module "@ipare/core" {
  interface Startup {
    useEnv(mode: string): this;
    useEnv(options?: EnvOptions): this;
  }
}

Startup.prototype.useEnv = function (options?: EnvOptions | string): Startup {
  return useEnv(this, options);
};

export { EnvOptions, ModeConfigOptions, DotenvConfigOptions } from "./options";
export { cliConfigHook } from "./cli-config";
export { getVersion } from "./version";
