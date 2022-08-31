import { METADATA } from "./constant";
import {
  CustomValidatorItem,
  libToProxy,
  ValidatorDecoratorReturnType,
} from "./validator-lib";

export type ValidateItem = {
  createTempObj?: (property: string, value: any) => object;
  name: string;
  args: any[];
} & Partial<CustomValidatorItem>;

export type RuleRecord = {
  validates: ValidateItem[];
  target: any;
  propertyKey?: symbol | string;
  parameterIndex?: number;
};

export function createClassValidatorDecorator(
  lib: ValidatorDecoratorReturnType,
  validator: () => PropertyDecorator,
  methodName: string
): ValidatorDecoratorReturnType {
  lib.validates.push({
    createTempObj: (property: string, value: any) => {
      function TestClass() {
        //
      }
      TestClass.prototype[property] = value;
      validator()(TestClass.prototype, property);
      return new TestClass();
    },
    name: methodName,
    args: [],
  });

  return createDecorator(lib);
}

export function createCustomValidatorDecorator(
  lib: ValidatorDecoratorReturnType,
  validator: CustomValidatorItem,
  args: any[]
): ValidatorDecoratorReturnType {
  lib.validates.push({
    ...validator,
    args,
  });

  return createDecorator(lib);
}

function createDecorator(lib: ValidatorDecoratorReturnType) {
  const decorator = function (
    target: any,
    propertyKey?: symbol | string,
    parameterIndex?: number
  ) {
    target = target.prototype ?? target;

    const rules: RuleRecord[] = Reflect.getMetadata(METADATA, target) ?? [];
    rules.push({
      validates: lib.validates,
      target,
      propertyKey,
      parameterIndex,
    });
    Reflect.defineMetadata(METADATA, rules, target);
  };
  Object.assign(decorator, lib);
  return libToProxy(decorator as any);
}
