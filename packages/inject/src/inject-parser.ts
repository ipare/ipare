import { HttpContext, isFunction, ObjectConstructor } from "@sfajs/core";
import { DECORATOR_SCOPED_BAG, MAP_BAG, METADATA } from "./constant";
import { InjectType } from "./inject-type";
import "reflect-metadata";
import { InjectMap } from "./inject-map";

type InjectTarget<T extends object = any> = T | ObjectConstructor<T>;

type InjectDecoratorRecordItem = {
  injectConstructor: ObjectConstructor;
  value: any;
};

class InjectDecoratorParser<T extends object = any> {
  constructor(
    private readonly ctx: HttpContext,
    private readonly target: InjectTarget<T>
  ) {
    const isConstructor = isFunction(this.target);
    this.injectConstructor = isConstructor
      ? (this.target as ObjectConstructor<T>)
      : ((this.target as T).constructor as ObjectConstructor<T>);
    this.obj = isConstructor
      ? new (this.target as ObjectConstructor<T>)()
      : (this.target as T);
  }

  private static readonly singletonInject: InjectDecoratorRecordItem[] = [];

  private readonly obj: T;
  private readonly injectConstructor: ObjectConstructor<T>;

  public parse(): T {
    const properties =
      (Reflect.getMetadata(METADATA, this.injectConstructor.prototype) as (
        | string
        | symbol
      )[]) ?? [];
    properties.forEach((property) => {
      this.setProperty(property);
    });
    return this.obj;
  }

  private setProperty(property: string | symbol) {
    this.obj[property] = this.getPropertyValue(property);
  }

  private getPropertyValue(property: string | symbol) {
    const constr = Reflect.getMetadata(
      "design:type",
      this.obj,
      property
    ) as ObjectConstructor<T>;

    const obj = this.createObjectByConstructor(constr);
    return new InjectDecoratorParser(this.ctx, obj).parse();
  }

  private createObjectByConstructor(constr: ObjectConstructor<T>): any {
    const injectMaps = this.ctx.bag<InjectMap[]>(MAP_BAG) ?? [];
    const existMap = injectMaps.filter((map) => map.anestor == constr)[0];
    if (!existMap) {
      return new constr();
    }

    if (
      existMap.type == InjectType.Scoped ||
      existMap.type == InjectType.Singleton
    ) {
      let records: InjectDecoratorRecordItem[];
      if (existMap.type == InjectType.Scoped) {
        records =
          this.ctx.bag<InjectDecoratorRecordItem[]>(DECORATOR_SCOPED_BAG);
      } else {
        records = InjectDecoratorParser.singletonInject;
      }

      const existInject = records.filter(
        (item) => item.injectConstructor == this.injectConstructor
      )[0];
      if (existInject) {
        return existInject.value;
      } else {
        const obj = this.createPropertyObject(existMap.target);
        records.push({
          injectConstructor: this.injectConstructor,
          value: obj,
        });
        return obj;
      }
    } else {
      return this.createPropertyObject(existMap.target);
    }
  }

  private createPropertyObject(constr: ObjectConstructor<T>): any {
    return new InjectDecoratorParser(this.ctx, new constr()).parse();
  }
}

export function parseInject<T extends object = any>(
  ctx: HttpContext,
  target: InjectTarget<T>
): T {
  return new InjectDecoratorParser<T>(ctx, target).parse();
}
