import { Action } from "@sfajs/router-act";

export default class extends Action {
  async invoke(): Promise<void> {
    const email = this.ctx.req.query.email;
    const password = this.ctx.req.query.password;

    this.ok({
      email,
      password,
    });
    return;
  }
}
