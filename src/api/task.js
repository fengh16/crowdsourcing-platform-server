const Router = require('koa-router');
const coreTask = require('../core/task');
const multer = require('./multer');
const {coreToMiddleware} = require('./utils');

module.exports = function (global) {
  const router = new Router();
  const pictureMulter = multer({
    destination: global.config['upload-dir'],
    types: ['image/png', 'image/gif', 'image/jpeg'],
    maxSize: 10 * 1024 * 1024,
    fields: {
      tags: x => JSON.parse(x)
    }
  }).single('picture');
  router.post('/', pictureMulter, coreToMiddleware(coreTask.createTask));
  router.get('/:id', coreToMiddleware(coreTask.getTask));
  router.patch('/:id', pictureMulter, coreToMiddleware(coreTask.patchTask));
  return router;
};
