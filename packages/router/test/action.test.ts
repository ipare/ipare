import { HttpContext, StatusCode, Request, Response } from "sfa";
import { Action } from "../src/index";

class Login extends Action {
  async invoke(): Promise<void> {
    const { account, password } = <Record<string, unknown>>this.ctx.req.data;

    if (account != "abc") {
      this.notFound("用户不存在");
      return;
    }
    if (password != "123456") {
      this.badRequest("密码错误");
      return;
    }

    this.ok("action ok");
  }
}

test("action test", async function () {
  const loginAction = new Login();
  const ctx = new HttpContext(
    new Request().setData({
      account: "abc",
      password: "123456",
    })
  );
  ctx.res.status = StatusCode.ok;
  loginAction.init(ctx, 0);

  await loginAction.invoke();
  expect(loginAction.ctx.res.status).toBe(StatusCode.ok);

  loginAction.ctx.req.data.password = "12345";
  await loginAction.invoke();
  expect(loginAction.ctx.res.status).toBe(StatusCode.badRequest);

  loginAction.ctx.req.data.account = "12";
  await loginAction.invoke();
  expect(loginAction.ctx.res.status).toBe(StatusCode.notFound);
});
