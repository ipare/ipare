import { Action } from "../../../../../src";

export default class extends Action {
  async invoke(): Promise<void> {
    this.ok({
      method: "POST",
      action: "params2/nextParams",
    });
  }
}
