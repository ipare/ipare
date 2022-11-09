import { MicroTcpClient, MicroTcpStartup } from "../src";

describe("client", () => {
  it("should send message and return boolean value", async () => {
    const startup = new MicroTcpStartup({
      port: 23334,
    }).use((ctx) => {
      ctx.res.setBody(ctx.req.body);
    });
    const { port } = await startup.dynamicListen();

    const client = new MicroTcpClient({
      port,
    });
    await client.connect();
    const result = await client.send("", true);
    startup.close();
    client.dispose();

    expect(result.data).toBe(true);
  });

  it("should send message and return value when use prefix", async () => {
    const startup = new MicroTcpStartup({
      prefix: "pf",
    }).use((ctx) => {
      ctx.res.setBody(ctx.req.body);
    });
    const { port } = await startup.dynamicListen();

    const client = new MicroTcpClient({
      port,
      prefix: "pf",
    });
    await client.connect();
    const result = await client.send("", "abc");
    startup.close();
    client.dispose();

    expect(result.data).toBe("abc");
  });

  it("should send message and return undefined value", async () => {
    const startup = new MicroTcpStartup({
      port: 23334,
    }).use((ctx) => {
      ctx.res.setBody(ctx.req.body);
    });
    const { port } = await startup.dynamicListen();

    const client = new MicroTcpClient({
      port,
    });
    await client.connect();
    const result = await client.send("", undefined);
    startup.close();
    client.dispose();

    expect(result.data).toBeUndefined();
  });

  it("should emit message", async () => {
    let invoke = false;
    const startup = new MicroTcpStartup({
      port: 23334,
    }).use(() => {
      invoke = true;
    });
    const { port } = await startup.dynamicListen();

    const client = new MicroTcpClient({
      port,
    });
    await client.connect();
    client.emit("", true);

    await new Promise<void>((resolve) => {
      setTimeout(() => {
        startup.close();
        client.dispose();
        resolve();
      }, 1000);
    });
    expect(invoke).toBeTruthy();
  });

  it("should connect error with error host", async () => {
    const client = new MicroTcpClient({
      port: 443,
      host: "0.0.0.0",
    });

    let consoleError = false;
    const beforeError = console.error;
    console.error = () => {
      consoleError = true;
      console.error = beforeError;
    };
    await client.connect();
    console.error = beforeError;
    expect(consoleError).toBeTruthy();

    const sendResult = await client.send("", true);
    let emitError: any;
    try {
      client.emit("", "");
    } catch (err) {
      emitError = err as Error;
    }

    client.dispose();

    expect(emitError.message).toBe("The connection is not connected");
    expect(sendResult).toEqual({
      error: "The connection is not connected",
    });
  });

  it("should listen with default port when port is undefined", async () => {
    const client = new MicroTcpClient({
      host: "127.0.0.2",
    });

    let consoleError = false;
    const beforeError = console.error;
    console.error = () => {
      consoleError = true;
      console.error = beforeError;
    };
    try {
      await client.connect();
    } catch (err) {
      console.error(err);
    }

    console.error = beforeError;
    expect(consoleError).toBeTruthy();
    client.dispose();
  });

  it("should wait all times with timeout = 0", async () => {
    const startup = new MicroTcpStartup({
      port: 23334,
    }).use((ctx) => {
      ctx.res.setBody(ctx.req.body);
    });
    const { port } = await startup.dynamicListen();
    startup["handleMessage"] = () => undefined;

    const client = new MicroTcpClient({
      port,
    });
    await client.connect();

    const waitResult = await new Promise<boolean>(async (resolve) => {
      setTimeout(() => resolve(true), 5000);
      await client.send("abc", "", 0);
      resolve(false);
    });
    client.dispose();
    startup.close();

    expect(waitResult).toBeTruthy();
  }, 10000);

  it("should return error when send timeout and set timeout options", async () => {
    const startup = new MicroTcpStartup({
      port: 23334,
    }).use((ctx) => {
      ctx.res.setBody(ctx.req.body);
    });
    const { port } = await startup.dynamicListen();
    startup["handleMessage"] = () => undefined;

    const client = new MicroTcpClient({
      port,
      sendTimeout: 1000,
    });
    await client.connect();

    const result = await client.send("abc", "");
    client.dispose();
    startup.close();

    expect(result).toEqual({
      error: "Send timeout",
    });
  }, 10000);

  it("should return error when send timeout and set timeout argument", async () => {
    const startup = new MicroTcpStartup({
      port: 23334,
    }).use((ctx) => {
      ctx.res.setBody(ctx.req.body);
    });
    const { port } = await startup.dynamicListen();
    startup["handleMessage"] = () => undefined;

    const client = new MicroTcpClient({
      port,
    });
    await client.connect();

    const result = await client.send("abc", "", 1000);
    client.dispose();
    startup.close();

    expect(result).toEqual({
      error: "Send timeout",
    });
  }, 10000);
});
