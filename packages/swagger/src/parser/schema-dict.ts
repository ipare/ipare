import { isClass, isUndefined, ObjectConstructor } from "@ipare/core";
import { PipeReqType } from "@ipare/pipe";
import {
  getRules,
  RuleRecord,
  ValidateItem,
  ValidatorDecoratorReturnType,
} from "@ipare/validator";
import { ParameterLocation, SchemaObject } from "openapi3-ts";

type SchemaDictOptionType = {
  optName?: string;
  func: (...args: any[]) => ValidatorDecoratorReturnType;
  type?: "true" | "false" | "array" | "value" | "schema" | "custom";
  customValue?: any;
};

export type SchemaDictType =
  | SchemaDictOptionType
  | ((...args: any[]) => ValidatorDecoratorReturnType);

function dynamicSetValue(
  lib: ValidatorDecoratorReturnType,
  target: object,
  rules: RuleRecord[],
  ...args: SchemaDictType[]
) {
  args.forEach((arg) => {
    let options: SchemaDictOptionType;
    if (typeof arg == "function") {
      options = {
        func: arg,
      };
    } else {
      options = arg;
    }

    let optName: string;
    if (options.optName) {
      optName = options.optName;
    } else {
      optName = options.func.name;
      optName = optName.replace(optName[0], optName[0].toLowerCase());
    }

    getNamedValidates(rules, options.func.name).forEach((v) => {
      const args = v.args ?? [];
      if (options.type == "true") {
        target[optName] = true;
      } else if (options.type == "false") {
        target[optName] = false;
      } else if (options.type == "array") {
        target[optName] = args;
      } else if (options.type == "schema") {
        const schemaValue = args[0];
        if (isClass(schemaValue)) {
          target[optName] = {
            type: "object",
            properties: {},
          } as SchemaObject;
          setModelSchema(lib, schemaValue, target[optName]);
        } else {
          target[optName] = schemaValue;
        }
      } else if (options.type == "custom") {
        target[optName] = options.customValue;
      } else {
        target[optName] = args[0];
      }
    });
  });
}

export function setActionValue(
  lib: ValidatorDecoratorReturnType,
  target: object,
  rules: RuleRecord[]
) {
  dynamicSetValue(
    lib,
    target,
    rules,
    {
      func: lib.Tags,
      type: "array",
    },
    lib.Description,
    lib.Summary,
    lib.ExternalDocs,
    lib.OperationId,
    lib.Callbacks,
    lib.Deprecated,
    {
      func: lib.Deprecated,
      type: "true",
    },
    {
      func: lib.Security,
      type: "array",
    },
    {
      func: lib.Servers,
      type: "array",
    }
  );
}

export function setSchemaValue(
  lib: ValidatorDecoratorReturnType,
  target: SchemaObject,
  rules: RuleRecord[]
) {
  dynamicSetValue(
    lib,
    target,
    rules,
    {
      func: lib.IsNotEmpty,
      optName: "nullable",
      type: "false",
    },
    {
      func: lib.IsEmpty,
      optName: "nullable",
      type: "true",
    },
    lib.Discriminator,
    {
      func: lib.ReadOnly,
      type: "true",
    },
    {
      func: lib.WriteOnly,
      type: "true",
    },
    lib.Xml,
    lib.ExternalDocs,
    lib.Example,
    {
      func: lib.Examples,
      type: "array",
    },
    lib.Deprecated,
    lib.Type,
    lib.Format,
    {
      func: lib.Items,
      type: "schema",
    },
    {
      func: lib.Items,
      optName: "type",
      type: "custom",
      customValue: "array",
    },
    lib.Description,
    lib.Default,
    lib.Title,
    {
      func: lib.Max,
      optName: "maximum",
    },
    {
      func: lib.Min,
      optName: "mininum",
    },
    lib.MinLength,
    lib.MaxLength,
    {
      func: lib.Matches,
      optName: "pattern",
    },
    {
      func: lib.ArrayMaxSize,
      optName: "maxItems",
    },
    {
      func: lib.ArrayMinSize,
      optName: "minItems",
    },
    {
      func: lib.ArrayUnique,
      optName: "uniqueItems",
      type: "true",
    },
    lib.MinProperties,
    lib.MaxProperties,
    {
      func: lib.Required,
      optName: "nullable",
      type: "false",
    },
    {
      func: lib.IsNotEmpty,
      optName: "required",
      type: "true",
    },
    {
      func: lib.Enum,
      type: "array",
    }
  );
}

export function setParamValue(
  lib: ValidatorDecoratorReturnType,
  target: object,
  rules: RuleRecord[]
) {
  dynamicSetValue(
    lib,
    target,
    rules,
    lib.Description,
    {
      func: lib.Required,
      type: "true",
    },
    {
      func: lib.IsNotEmpty,
      type: "true",
    },
    {
      func: lib.Deprecated,
      type: "true",
    },
    {
      func: lib.IsOptional,
      optName: "allowEmptyValue",
      type: "true",
    },
    lib.Style,
    {
      func: lib.Explode,
      type: "true",
    },
    {
      func: lib.AllowReserved,
      type: "true",
    },
    lib.Examples,
    lib.Example
  );
}

export function setRequestBodyValue(
  lib: ValidatorDecoratorReturnType,
  target: object,
  rules: RuleRecord[]
) {
  dynamicSetValue(lib, target, rules, lib.Description, {
    func: lib.Required,
    type: "true",
  });
}

export function getNamedValidates(rules: RuleRecord[], name: string) {
  const validates: ValidateItem[] = [];
  rules.forEach((r) => {
    validates.push(...r.validates.filter((v) => v.name == name));
  });
  return validates;
}

export function setModelSchema(
  lib: ValidatorDecoratorReturnType,
  modelType: ObjectConstructor,
  schema: SchemaObject
) {
  const propertiesObject = schema.properties as Exclude<
    typeof schema.properties,
    undefined
  >;
  const requiredProperties: string[] = [];
  schema.required = requiredProperties;

  const rules = getRules(modelType).filter(
    (rule) => !isUndefined(rule.propertyKey)
  );
  const properties = rules.reduce((prev, cur) => {
    (prev[cur.propertyKey as string] =
      prev[cur.propertyKey as string] || []).push(cur);
    return prev;
  }, {});
  Object.keys(properties).forEach((property) => {
    const propertyCls = Reflect.getMetadata("design:type", modelType, property);

    const propertySchema = {
      type: typeToApiType(propertyCls),
    } as SchemaObject;
    propertiesObject[property] = propertySchema;

    const propertyRules = properties[property];
    setSchemaValue(lib, propertySchema, propertyRules);

    if (propertySchema.nullable == false) {
      requiredProperties.push(property);
    }
  });
}

export function typeToApiType(
  type?: any
):
  | "string"
  | "number"
  | "boolean"
  | "object"
  | "integer"
  | "null"
  | "array"
  | undefined {
  if (type == String) {
    return "string";
  } else if (type == Number) {
    return "number";
  } else if (type == BigInt) {
    return "integer";
  } else if (type == Boolean) {
    return "boolean";
  } else if (type == Array) {
    return "array";
  } else {
    return "object";
  }
}

export function pipeTypeToDocType(pipeType: PipeReqType): ParameterLocation {
  if (pipeType == "body") {
    throw new Error();
  }

  switch (pipeType) {
    case "header":
      return "header";
    case "query":
      return "query";
    default:
      return "path";
  }
}
