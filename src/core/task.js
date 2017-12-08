/**
 * 用户模块
 * @module core/task
 */

const ajv = new (require('ajv'))();
const {errorsEnum, coreOkay, coreValidate, coreAssert} = require('./errors');

const idRegex = /^[a-f\d]{24}$/i;

const querySchema = ajv.compile({
  type: 'object',
  properties: {
    populate: {type: 'string', enum: ['false', 'true']}
  },
  additionalProperties: false
});

const createTaskSchema = [
  ajv.compile({
    type: 'object',
    required: ['name', 'publisher', 'description', 'moneyLeft', 'spentMoney', 'taskType'],
    properties: {
      name: {type: 'string'},
      description: {type: 'string'},
      expiredAt: {type: 'date'},
      moneyLeft: {type: 'number'},
      moneySpent: {type: 'number'},
      taskType: {type: 'number'},
      tags: {
        type: 'array',
        items: {
          type: 'string'
        }
      }
    },
    additionalProperties: false
  })
];

/**
 * 创建任务。
 *   ajax: POST /api/task/:id
 *   socket.io: emit task:create
 * @param params {object}
 *  - auth {object} 权限
 *  - query {object} 请求query
 *    - populate {boolean} 可选，默认false,返回task id
 *  - data {object} 访问的数据
 *    - name {string} 必须，任务标题
 *    - description {string} 必须，任务描述
 *    - moneyLeft {number} 必须，剩余金额
 *    - moneySpent {number} 必须，已花金额
 *    - taskType {number} 必须，任物类型
 *    - expiredAt {date} 可选，失效日期
 *    - tags {string[]} 可选，标签
 * @param global {object}
 *  - tasks {object} Tasks model
 * @return {Promise.<object>} 如果不`populate`，`data`为任务的`_id`，否则为整个任务字段。
 */

async function createTask(params, global) {
  const {tasks, users} = global;
  coreAssert(params.auth && (params.auth.role & users.roleEnum.PUBLISHER),
    errorsEnum.PERMISSION, 'Requires publisher privilege');
  coreValidate(querySchema, params.query);
  coreValidate(createTaskSchema, params.data);
  const task = await new tasks(
    Object.assign({},
      params.data,
      {status: tasks.statics.statusEnum.TO_BE_SUBMITTED, publisher: params.auth.uid})
  );
  await task.save();
  return coreOkay({
    data: params.query.populate === 'true'
      ? task : task._id
  });
}

/**
 * 獲取任务詳情。
 *   ajax: GET /api/task/:id
 *   socket.io: emit task:get
 * @param params {object}
 *  - auth {object} 权限
 *  - id {string} 要获取详情的任务的id
 * @param global {object}`
 *  - tasks {object} Tasks model
 * @return {Promise.<object>}
 */

async function getTask(params, global) {
  const {tasks} = global;
  coreAssert(params.id && idRegex.test(params.id), errorsEnum.SCHEMA, 'Invalid id');
  const task = await tasks.findById(params.id).notDeleted();
  coreAssert(task, errorsEnum.INVALID, 'Task not found.');
  return coreOkay(task);
}

const patchTaskSchema = [
  ajv.compile({
    type: 'object',
    properties: {
      name: {type: 'string'},
      description: {type: 'string'},
      expiredAt: {type: 'date'},
      submittedAt: {type: 'date'},
      publishedAt: {type: 'date'},
      completedAt: {type: 'date'},
      moneyLeft: {type: 'number'},
      moneySpent: {type: 'number'},
      taskType: {type: 'number'},
      tags: {
        type: 'array',
        items: {
          type: 'string'
        }
      },
      status: {type: 'number'}
    },
    additionalProperties: false
  })
];

/**
 * 修改任务詳情。
 *   ajax: PATCH /api/task/:id
 *   socket.io: emit task:patch
 * @param params {object}
 *  - id {string} 要修改的任务的id
 *  - query {object}
 *    - populate {boolean} 可选，默认false,返回task id
 *  - data {object} 修改的数据，必须是该任务publisher或TASK_ADMIN才能修改
 *    - name {string} 任务标题
 *    - description {string} 任务描述
 *    - moneyLeft {number} 剩余金额
 *    - moneySpent {number} 已花金额
 *    - status {number} 任物状态
 *    - taskType {number} 任物类型
 *    - expiredAt {date} 失效日期
 *    - submittedAt: {date} 提交日期
 *    - publishedAt: {date} 发布日期
 *    - completedAt: {date} 完成日期
 *    - tags {[string]} 标签
 * @param global {object}
 *  - tasks {object} Tasks model
 *  - users {object} Users model
 * @return {Promise.<object>}
 */

async function patchTask(params, global) {
  const {tasks, users} = global;
  coreAssert(params.id && idRegex.test(params.id), errorsEnum.SCHEMA, 'Invalid id');
  coreValidate(querySchema, params.query);
  coreValidate(patchTaskSchema, params.data);
  const task = await tasks.findById(params.id).notDeleted();
  coreAssert(task, errorsEnum.INTERNAL, 'Task not found');
  const isPublisher = params.auth && params.auth.uid === task.publisher;
  const isTaskAdmin = params.auth && (params.auth.role & users.roleEnum.TASK_ADMIN);
  coreAssert(isPublisher || isTaskAdmin, errorsEnum.PERMISSION, 'Permission denied');
  await task.set(params.data);
  await task.save();
  return coreOkay({
    data: params.query.populate === 'true'
      ? task : task._id
  });
}

module.exports = {
  createTask,
  getTask,
  patchTask
};
