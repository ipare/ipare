import { HttpContext } from "@sfajs/core";
import { ValidationOptions } from "class-validator";
import "reflect-metadata";
import {
  SCHAME_METADATA,
  ENABLE_METADATA,
  OPTIONS_METADATA,
} from "../constant";

export function UseValidatorOptions(
  options: (
    ctx: HttpContext,
    val: any
  ) => ValidationOptions | Promise<ValidationOptions>
): ClassDecorator;
export function UseValidatorOptions(options: ValidationOptions): ClassDecorator;
export function UseValidatorOptions(options: any): ClassDecorator {
  return function (target: any) {
    Reflect.defineMetadata(OPTIONS_METADATA, options, target);
  };
}

export function UseValidatorSchema(
  schemaName: (ctx: HttpContext, val: any) => string | Promise<string>
): ClassDecorator;
export function UseValidatorSchema(schemaName: string): ClassDecorator;
export function UseValidatorSchema(schemaName: any): ClassDecorator {
  return function (target: any) {
    Reflect.defineMetadata(SCHAME_METADATA, schemaName, target);
  };
}

export function ValidatorEnable(
  fn: (ctx: HttpContext, val: any) => boolean | Promise<boolean>
): ClassDecorator {
  return function (target: any) {
    Reflect.defineMetadata(ENABLE_METADATA, fn, target);
  };
}