[![Build Status](https://travis-ci.org/sunziping2016/crowdsourcing-platform-server.svg?branch=master)](https://travis-ci.org/sunziping2016/crowdsourcing-platform-server)

# 目录

<!-- @import "[TOC]" {cmd="toc" depthFrom=1 depthTo=6 orderedList=false} -->
<!-- code_chunk_output -->

* [目录](#目录)
* [1 关于](#1-关于)
	* [1.1 项目目录简介](#11-项目目录简介)
	* [1.2 项目启动及部署](#12-项目启动及部署)
* [2 设计](#2-设计)
	* [2.1 数据表](#21-数据表)
		* [2.1.1 `users`表](#211-users表)
		* [2.1.2 `wechatUsers`表](#212-wechatusers表)

<!-- /code_chunk_output -->

# 1 关于

这是一个在线众包平台的服务端，作为我们软件工程(3)的大作业项目。以下是项目的相关链接。
* [后端项目GitHub地址](https://github.com/sunziping2016/crowdsourcing-platform-server)
* [前端项目GitHub地址](https://github.com/sunziping2016/crowdsourcing-platform-client)
* [用户故事文档](https://github.com/sunziping2016/crowdsourcing-platform-server/blob/master/docs/user-story.md)
* [项目自动生成文档](https://sunziping2016.github.io/crowdsourcing-platform-server/0.1.0/index.html)

## 1.1 项目目录简介
文档主要是有一下几个部分：
* `docs/`：存放文档（不同于自动生成文档）
* `README.md`：自动生成文档的首页

自动文档会依据注释生成，具体格式可以参照[Use JSDoc: Getting Started with JSDoc 3](http://usejsdoc.org/about-getting-started.html)。

代码主要是：
* `test/`：项目测试代码
* `src/`：项目核心代码
  * `models/`：model数据层
  * `core/`：controller控制层，操纵数据层
  * `api/`：RESTful API的事件处理
  * `socket/`：Socket.io的事件处理
  * `wechat/`：微信消息推送的事件处理
  * `server.js`：整个服务端的对象
* `app.js`：启动`src/server.js`
* `config.json`：项目的配置文件（在`.gitignore`中）
* `package.json`：`npm`的配置文件

因而整个项目模块之间的依赖如下：

![模块依赖图](docs/module-dependency.svg)

此外还有额外的配置：
* `.editorconfig`：编辑器配置
* `.eslintrc`：代码风格检查工具配置（这是强制的，不通过就报错）
* `.jsdoc.json`：自动文档生成配置
* `.travis.yml`：Travis CI配置

## 1.2 项目启动及部署
本项目依赖两个数据库：
* MongoDB
* Redis

配置完这两个数据库后，可以通过如下命令启动server：
```bash
# Install Dependencies
npm install
# Start Server
node app # Or `npm start`
```

建议提交前应当跑一下测试：
```bash
# Check coding style
npm run lint
# Unit test
npm run test
```

部署项目自动文档到GitHub上可以采用如下方式：
```bash
# Generate documentation from code
npm run docs
# Deploy documentation to GitHub Pages
npm run gh-pages
```

当然每次提交之后会有[CI](https://travis-ci.org/sunziping2016/crowdsourcing-platform-server)自动测试并部署文档。

# 2 设计
## 2.1 数据表

### 2.1.1 `users`表

| 字段 | 类型 | 注解 |
|:---:|:---|:---|
| _id | ObjectId | |
| username | String | 未删则唯一，必要 |
| password | String | bcrypt，可为null（不可登录，强制重置密码） |
| roles | Array<String> | 必要 |
| email | String | 未删且存在则唯一，可选 |
| wechatId | String, ref `wechatUsers` | 未删且存在则唯一，可选 |
| settings | any (Object) | 见下，用户设置，仅自己可见 |
| status | Integer | 状态：有效、冻结、删除（注销） |
| createdAt | Date | |
| updatedAt | Date | |
| deleted | Boolean | 是否删除，必要 |

其中`roles`可以为以下几种：
* subscriber： 可以领取任务
* publisher：可以发布任务
* taskAdmin：可以管理任务
* userAdmin：可以管理用户
* siteAdmin：可以对站点、微信进行设置

`settings`待定。

### 2.1.2 `wechatUsers`表

注意除了`_id`外，别的都是可选。部分内容详见[微信公众平台 - 获取用户基本信息](https://mp.weixin.qq.com/wiki?t=resource/res_main&id=mp1421140839)

| 字段 | 类型 | 注解 |
|:---:|:---|:---|
| _id (alias openId) | ObjectId | |
| subscribe | Boolean | |
| nickname | String | |
| gender | Number | |
| language | String | |
| avatar | String | 相对于 uploads 目录的位置 |
| avatarThumbnail | String | 相对于 uploads 目录的位置 |
