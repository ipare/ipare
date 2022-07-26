export { TestMicroNatsStartup } from "./test-micro-nats-startup";
export { createMock, mockPkgName, JSONCodec } from "./mock";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    export interface ProcessEnv {
      IS_LOCAL_TEST: "true" | "";
    }
  }
}
