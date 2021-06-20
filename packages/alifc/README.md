# @sfajs/alifunc

将 sfa 托管到阿里云函数计算

> 目前只支持 HTTP 函数

## 安装

```
npm i @sfajs/alifunc
```

## 开始使用

```JS
const SfaAlifunc = require("@sfajs/alifunc");

const handler = async function (req, resp, context) {
  await new SfaAlifunc(req, resp, context)
    .use(async (ctx) => {
      ctx.res.headers.demo = "@sfajs/alifunc";
    })
    .run();
};
module.exports.handler = handler;
```

如果添加 `@sfajs/router`

```JS
const SfaAlifunc = require("@sfajs/alifunc");
require("@sfajs/router");

const handler = async function (req, resp, context) {
  await new SfaAlifunc(req, resp, context)
    .use(async (ctx, next) => {
      ctx.res.headers.demo = "@sfajs/alifunc";
      await next();
    })
    .useRouter()
    .run();
};
module.exports.handler = handler;
```

## 解析 body

阿里云函数计算没有解析 body，但 `@sfajs/alifunc` 支持四种 body 解析

使用详情参考 [@sfajs/http](https://github.com/sfajs/http)

- json
- text
- urlencoded
- multipart

```JS
await new SfaAlifunc(req, resp, context)
  .useHttpJsonBody()
  .useHttpTextBody()
  .useHttpUrlencodedBody()
  .useHttpMultipartBody()
  .run();
```