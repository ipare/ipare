import { Middleware, SfaRequest, TestStartup } from "@sfajs/core";
import { Body } from "@sfajs/pipe";
import { IsInt, ValidationSchema } from "class-validator";
import "@sfajs/inject";
import "../src";
import { UseValidatorSchema, ValidatorEnable } from "../src";

function testSchema(useSchema: boolean) {
  function runTest(func: boolean) {
    test(`schema test ${useSchema} ${func}}`, async () => {
      const schemaName = func ? () => "testSchema" : "testSchema";
      @UseValidatorSchema(schemaName as any)
      @ValidatorEnable(() => useSchema)
      class TestDto {
        @IsInt()
        b1!: number;

        get b() {
          return this.b1;
        }
      }

      class TestMiddleware extends Middleware {
        @Body
        private readonly body!: TestDto;
        @Body("b1")
        private readonly b1!: string;

        async invoke(): Promise<void> {
          this.setHeader("b1", this.b1);
          this.ok(this.body);
        }
      }

      const testSchema: ValidationSchema = {
        name: "testSchema",
        properties: {
          b1: [
            {
              type: "isEmail",
            },
          ],
        },
      };

      const startup = new TestStartup(
        new SfaRequest().setBody({
          b1: "1",
        })
      )
        .useInject()
        .useValidator();
      if (useSchema) {
        startup.useValidationSchema(testSchema);
      }
      const res = await startup.add(TestMiddleware).run();

      console.log("body", res.body);
      if (useSchema) {
        expect(res.status).toBe(400);
        expect(res.body).toEqual({
          message: "b1 must be an integer number",
          status: 400,
        });
        expect(res.getHeader("b1")).toBeUndefined();
      } else {
        expect(res.status).toBe(200);
        expect(res.body.b).toBe("1");
        expect(res.getHeader("b1")).toBe("1");
      }
    });
  }
  runTest(true);
  runTest(false);
}

testSchema(true);
testSchema(false);