import { Action } from "../../../src";

/**
 * @action put docs
 *
 * a docs test named put
 *
 * @parts @auth
 * @input input desc
 * @@body
 * @@@test-body1 {string} a test body of putting docs NO.1
 */
export default class extends Action {
  constructor() {
    super(["test1", "custom"]);
  }

  async invoke(): Promise<void> {
    this.ok({
      method: "PUT",
    });
  }
}