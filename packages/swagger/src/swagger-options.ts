import { OpenApiBuilder } from "openapi3-ts";

type SwaggerBuilder = (builder: OpenApiBuilder) => OpenApiBuilder;

export interface SwaggerOptions {
  path?: string;
  builder?: SwaggerBuilder;
  modelCwd?: string;
  modelIgnore?: readonly string[];
  customHtml?:
    | ((jsonStr: string) => Promise<string>)
    | ((jsonStr: string) => string);
}