import { MicroNatsClient, MicroNatsStartup } from "../src";
import { MicroNatsConnection } from "../src/connection";
import { mockConnection, mockConnectionFrom } from "../src/mock";

describe("client", () => {
  it("should send message and return boolean value", async () => {
    const startup = new MicroNatsStartup({
      host: "localhost",
      port: 4222,
    })
      .use((ctx) => {
        ctx.res.setBody(ctx.req.body);
        expect(ctx.bag("pt")).toBeTruthy();
      })
      .pattern("test_return", (ctx) => {
        ctx.bag("pt", true);
      });
    mockConnection.bind(startup)();
    await startup.listen();

    await new Promise<void>((resolve) => {
      setTimeout(async () => {
        resolve();
      }, 500);
    });

    const client = new MicroNatsClient();
    mockConnectionFrom.bind(client)(startup);
    await client.connect();

    const result = await client.send("test_return", true);

    await new Promise<void>((resolve) => {
      setTimeout(async () => {
        resolve();
      }, 500);
    });

    await startup.close();
    await client.dispose();

    expect(result).toBe(true);
  });

  it("should send message and return value with prefix", async () => {
    const startup = new MicroNatsStartup({
      prefix: "pr",
    })
      .use((ctx) => {
        ctx.res.setBody(ctx.req.body);
        expect(ctx.bag("pt")).toBeTruthy();
      })
      .pattern("test_prefix", (ctx) => {
        ctx.bag("pt", true);
      });
    mockConnection.bind(startup)();
    await startup.listen();

    await new Promise<void>((resolve) => {
      setTimeout(async () => {
        resolve();
      }, 500);
    });

    const client = new MicroNatsClient({
      prefix: "pr",
    });
    mockConnectionFrom.bind(client)(startup);
    await client.connect();

    const result = await client.send("test_prefix", {
      a: 1,
      b: 2,
    });

    await new Promise<void>((resolve) => {
      setTimeout(async () => {
        resolve();
      }, 500);
    });

    await startup.close();
    await client.dispose();

    expect(result).toEqual({
      a: 1,
      b: 2,
    });
  });

  it("should send message and return undefined value", async () => {
    const startup = new MicroNatsStartup()
      .use((ctx) => {
        ctx.res.setBody(ctx.req.body);
        expect(ctx.bag("pt")).toBeTruthy();
      })
      .pattern("test_undefined", (ctx) => {
        ctx.bag("pt", true);
      });
    mockConnection.bind(startup)();
    await startup.listen();

    await new Promise<void>((resolve) => {
      setTimeout(async () => {
        resolve();
      }, 500);
    });

    const client = new MicroNatsClient();
    mockConnectionFrom.bind(client)(startup);
    await client.connect();

    const result = await client.send("test_undefined", undefined);

    await new Promise<void>((resolve) => {
      setTimeout(async () => {
        resolve();
      }, 500);
    });

    await startup.close();
    await client.dispose();

    expect(result).toBeUndefined();
  });

  it("should emit message", async () => {
    let invoke = false;
    const startup = new MicroNatsStartup()
      .use((ctx) => {
        invoke = true;
        expect(ctx.bag("pt")).toBeTruthy();
      })
      .pattern("test_emit", (ctx) => {
        ctx.bag("pt", true);
      });

    mockConnection.bind(startup)();
    await startup.listen();

    const client = new MicroNatsClient();
    mockConnectionFrom.bind(client)(startup);
    await client.connect();
    client.emit("test_emit", true);

    await new Promise<void>((resolve) => {
      setTimeout(async () => {
        await startup.close();
        await client.dispose();
        resolve();
      }, 500);
    });
    expect(invoke).toBeTruthy();
  });

  it("should connect error with error host", async () => {
    const client = new MicroNatsClient({
      port: 443,
      host: "0.0.0.0",
    });

    let err = false;
    try {
      await client.connect();
      await client.send("", true);
    } catch {
      err = true;
    }

    await new Promise<void>((resolve) => {
      setTimeout(async () => {
        resolve();
      }, 500);
    });

    await client.dispose();
    expect(err).toBeTruthy();
  });

  it("should listen with default port when port is undefined", async () => {
    const client = new MicroNatsClient({
      host: "127.0.0.2",
    });

    await client.connect();
    await client.dispose();
  });

  it("should not send data when client redis is not connected", async () => {
    const client = new MicroNatsClient({});
    client.emit("", "");
  });

  it("should create custom connection", async () => {
    class TestClass extends MicroNatsConnection {}
    const obj = new TestClass();
    expect(!!obj["initClients"]).toBeTruthy();
  });
});