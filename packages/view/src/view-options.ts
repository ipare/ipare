import * as consolidate from "consolidate";

type RendererInterface = typeof consolidate.ejs;
type Engine = { ext: string; render: RendererInterface | string };

export interface ViewOptions {
  dir?: string;
  options?: Record<string, unknown>;
  engines?: Engine[] | Engine;
}

export { RendererInterface, Engine, consolidate };
