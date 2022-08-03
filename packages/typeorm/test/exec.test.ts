import { TestStartup } from "@ipare/core";
import { parseInject } from "@ipare/inject";
import path from "path";
import "../src";
import { typeorm } from "../src";
import { OPTIONS_IDENTITY } from "../src/constant";
import { TestDto } from "./entities/TestDto";

it("should insert entity to sqlite", async () => {
  const res = await new TestStartup()
    .useTypeorm({
      type: "sqlite",
      database: "test/sqlite.db",
      synchronize: true,
      entities: [path.join(__dirname, "entities/*.ts")],
    })
    .use(async (ctx) => {
      const dataSource = await parseInject<typeorm.DataSource>(
        ctx,
        OPTIONS_IDENTITY
      );
      if (!dataSource) throw new Error();

      const testDto = new TestDto();
      testDto.name = "test";
      await dataSource.manager.save(testDto);
      const findResult = await dataSource.getRepository(TestDto).findOne({
        where: {
          name: "test",
        },
      });
      expect(!!findResult).toBeTruthy();
    })
    .run();

  expect(res.status).toBe(404);
});
