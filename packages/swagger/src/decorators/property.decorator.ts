import { isClass } from "@sfajs/core";
import { ParameterObject, SchemaObject } from "openapi3-ts";
import { MODEL_PROPERTIES } from "../constant";
import { typeToApiType } from "../parser/utils/doc-types";

export type DecoratorFn = (args: {
  type: "schema" | "param";
  schema: SchemaObject | ParameterObject[];
}) => void;

type SetSchemaValueDecoratorFn = (args: {
  type: "schema" | "param";
  schema: SchemaObject | ParameterObject;
}) => void;

function isSchema(
  type: "schema" | "param",
  schema: any
): schema is SchemaObject {
  return type == "schema";
}

function getParameterObject(propertyKey: string, schema: ParameterObject[]) {
  const existParameter = schema.filter((p) => p.name == propertyKey)[0];
  const parameter = existParameter ?? {
    name: propertyKey,
    // in: pipeTypeToDocType(this.record.type),
    // required: this.record.type == "param",
  };
  if (!existParameter) {
    schema.push(parameter);
  }
  return parameter;
}

function setValue(
  target: any,
  propertyKey: string,
  type: "schema" | "param",
  schema: SchemaObject | ParameterObject[],
  fn: SetSchemaValueDecoratorFn
) {
  let dict: SchemaObject | ParameterObject;
  if (isSchema(type, schema)) {
    if (!schema.properties) {
      schema.properties = {};
    }
    if (!schema.properties[propertyKey]) {
      schema.properties[propertyKey] = <SchemaObject>{
        type: typeToApiType(target),
        nullable: true,
      };
    }
    dict = schema.properties[propertyKey];
  } else {
    dict = getParameterObject(propertyKey, schema);
  }
  fn({
    type,
    schema: dict,
  });
}

function createPropertyDecorator(
  fn: (args: {
    type: "schema" | "param";
    schema: SchemaObject | ParameterObject;
    target: any;
    propertyKey: string;
  }) => void
) {
  return function (target: any, propertyKey: string) {
    const propertyDecs: DecoratorFn[] =
      Reflect.getMetadata(MODEL_PROPERTIES, target) ?? [];
    propertyDecs.push(({ type, schema }) => {
      if (isSchema(type, schema)) {
        fn({ type, propertyKey, schema, target });
      } else {
        fn({
          type,
          propertyKey,
          schema: getParameterObject(propertyKey, schema),
          target,
        });
      }
    });
    Reflect.defineMetadata(MODEL_PROPERTIES, propertyDecs, target);
  };
}

function createPropertySetValueDecorator(fn: SetSchemaValueDecoratorFn) {
  return function (target: any, propertyKey: string) {
    const propertyDecs: DecoratorFn[] =
      Reflect.getMetadata(MODEL_PROPERTIES, target) ?? [];
    propertyDecs.push(({ type, schema }) =>
      setValue(target, propertyKey, type, schema, fn)
    );
    Reflect.defineMetadata(MODEL_PROPERTIES, propertyDecs, target);
  };
}

export const ApiProperty = createPropertyDecorator(() => undefined);

export function PropertyDescription(description: string) {
  return createPropertySetValueDecorator(({ schema }) => {
    schema.description = description;
  });
}

export function PropertyIgnore() {
  return createPropertyDecorator(({ schema, propertyKey }) => {
    if (!schema.properties) {
      schema.properties = {};
      delete schema.properties[propertyKey];
    }
  });
}

export function PropertySchema(value: SchemaObject | ObjectConstructor) {
  return createPropertySetValueDecorator(({ schema, type }) => {
    if (isSchema(type, schema)) {
      Object.assign(schema, schema);
    } else {
      if (isClass(value)) {
        schema.schema = {
          $ref: `#/components/schemas/${schema.name}`,
        };
      } else {
        schema.schema = value;
      }
    }
  });
}

export function PropertyDeprecated() {
  return createPropertySetValueDecorator(({ schema }) => {
    schema.deprecated = true;
  });
}

export function PropertyRequired() {
  return createPropertyDecorator(({ target, propertyKey, schema, type }) => {
    if (isSchema(type, schema)) {
      if (!schema.required) {
        schema.required = [];
      }
      schema.required.push(propertyKey);
      setValue(
        target,
        propertyKey,
        type,
        schema,
        ({ schema: propertySchema }) => {
          delete propertySchema.nullable;
        }
      );
    } else {
      schema.required = true;
    }
  });
}

export function PropertyAllowEmptyValue() {
  return createPropertySetValueDecorator(({ schema, type }) => {
    if (!isSchema(type, schema)) {
      schema.allowEmptyValue = true;
    }
  });
}
