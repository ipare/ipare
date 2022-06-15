import { postbuild } from "../src";
import * as fs from "fs";
import { SfaRequest, TestStartup } from "@sfajs/core";
import { CONFIG_FILE_NAME } from "../src/constant";

test("empty config", async () => {
  let count = 0;
  try {
    await postbuild({
      config: {},
      cacheDir: ".sfa-cache",
    });
  } catch (err) {
    count++;
    expect((err as Error).message).toBe("The router dir is not exist");
  }
  expect(count).toBe(1);
});

test("build actions", async () => {
  fs.rmSync(`test/${CONFIG_FILE_NAME}`, {
    force: true,
  });

  await postbuild({
    config: {},
    cacheDir: "test",
  });

  expect(fs.existsSync(`test/${CONFIG_FILE_NAME}`)).toBeTruthy();

  fs.rmSync(`test/${CONFIG_FILE_NAME}`, {
    force: true,
  });
});

test("build and run", async () => {
  await postbuild({
    config: {
      routerActionsDir: "test/actions",
    },
    cacheDir: "",
  });

  const res = await new TestStartup(new SfaRequest().setMethod("get"))
    .useRouter()
    .run();

  fs.rmSync(CONFIG_FILE_NAME, {
    force: true,
  });

  expect(res.status).toBe(200);
  expect(res.body).toEqual({
    method: "GET",
  });
});
