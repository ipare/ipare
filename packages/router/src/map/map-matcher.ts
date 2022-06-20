import MapItem from "./map-item";
import { HttpContext, HttpMethod } from "@sfajs/core";
import { RouterOptionsMerged } from "../router-options";

export default class MapMatcher {
  constructor(
    private readonly ctx: HttpContext,
    private readonly options: RouterOptionsMerged
  ) {
    const mapItem = this.getMapItem();
    if (mapItem) {
      this.#mapItem = mapItem;
    }
  }

  #mapItem!: MapItem;
  public get mapItem(): MapItem {
    return this.#mapItem;
  }

  public notFound = false;
  public methodNotAllowed = false;

  private getMapItem(): MapItem | undefined {
    const matchedPaths = this.ctx.routerMap
      .filter((m) => !!m.methods.length)
      .filter((m) => this.isPathMatched(m, true));
    this.ctx.routerMap
      .filter((m) => !m.methods.length || m.methods.includes(HttpMethod.any))
      .filter((m) => this.isPathMatched(m, false))
      .forEach((m) => matchedPaths.push(m));
    const mapItem = this.getMostLikeMapItem(matchedPaths);
    if (mapItem) return mapItem;

    const otherMethodPathCount = this.ctx.routerMap.filter((m) =>
      this.isPathMatched(m, false)
    ).length;
    if (otherMethodPathCount) {
      this.methodNotAllowed = true;
    } else {
      this.notFound = true;
    }
  }

  private isPathMatched(mapItem: MapItem, methodIncluded: boolean): boolean {
    let reqUrl = this.ctx.req.path;
    if (this.options.prefix && reqUrl.startsWith(this.options.prefix)) {
      reqUrl = reqUrl
        .substring(this.options.prefix.length, reqUrl.length)
        .replace(/^\//, "");
    }
    const reqUrlStrs = reqUrl.toLowerCase().split("/");
    const mapUrlStrs = mapItem.url.toLowerCase().split("/");
    if (reqUrlStrs.length != mapUrlStrs.length) return false;

    if (methodIncluded && !mapItem.methods.includes(HttpMethod.any)) {
      const matchedMethod = HttpMethod.matched(
        this.ctx.req.method,
        this.options.customMethods
      );
      if (!matchedMethod || !mapItem.methods.includes(matchedMethod)) {
        return false;
      }
    }

    for (let i = 0; i < mapUrlStrs.length; i++) {
      if (mapUrlStrs[i] != reqUrlStrs[i] && !mapUrlStrs[i].startsWith("^")) {
        return false;
      }
    }
    return true;
  }

  private getMostLikeMapItem(mapItems: MapItem[]): MapItem | undefined {
    if (!mapItems || !mapItems.length) return;
    if (mapItems.length == 1) return mapItems[0];

    const pathsParts = <{ mapItem: MapItem; parts: string[] }[]>[];
    mapItems.forEach((mapItem) => {
      pathsParts.push({
        mapItem: mapItem,
        parts: mapItem.url.toLowerCase().split("/"),
      });
    });

    const minPartsCount = Math.min(...pathsParts.map((pp) => pp.parts.length));
    for (let i = 0; i < minPartsCount; i++) {
      if (
        pathsParts.some((p) => p.parts[i].includes("^")) &&
        pathsParts.some((p) => !p.parts[i].includes("^"))
      ) {
        pathsParts
          .filter((p) => p.parts[i].includes("^"))
          .forEach((p) => pathsParts.splice(pathsParts.indexOf(p), 1));
      }

      if (pathsParts.length == 1) return pathsParts[0].mapItem;
    }

    if (
      pathsParts.some((pp) => pp.mapItem.methods.includes(HttpMethod.any)) &&
      pathsParts.some((pp) => !pp.mapItem.methods.includes(HttpMethod.any))
    ) {
      pathsParts
        .filter((pp) => pp.mapItem.methods.includes(HttpMethod.any))
        .forEach((pp) => {
          pathsParts.splice(pathsParts.indexOf(pp), 1);
        });
    }

    return pathsParts.sort((a, b) => a.parts.length - b.parts.length)[0]
      .mapItem;
  }
}
