/**
 * 用户models，存储了所有用户（包括管理员和普通用户）的所有权限信息。
 *
 * @module models/users
 */
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const {addCreatedAt, addUpdatedAt, addFileFields} = require('./hook');

/**
 * 创建`users` model。
 *
 * @param global {object} 全局对象，主要使用了以下字段：
 *   - config：读取上传目录
 *   - db：Mongoose链接
 * @return {mongoose.model} `users` model
 */
module.exports = function (global) {
  const {config, db} = global;
  // 请确保`DELETED`拥有最大的值，因为我们使用Partial Indexes的小于运算符来筛选未删除的元素
  const statusEnum = {
    VALID: 0,
    FROZEN: 1,
    DELETED: 2
  };
  const roleEnum = {
    SUBSCRIBER: 1 << 0,
    PUBLISHER: 1 << 1,
    TASK_ADMIN: 1 << 2,
    USER_ADMIN: 1 << 3,
    SITE_ADMIN: 1 << 4
  };

  const userSettingsSchema = new mongoose.Schema({
  });

  /**
   * `users` schema对象，包含以下字段：
   *  - `username`：字符串，必要，未删除用户应当唯一
   *  - `password`：密码，必要，可以为`null`（此时密码验证永远失败）
   *  - `secureUpdatedAt`：安全更新时间，自动字段。用户认证时，对于请求续JWT的，如果发生了安全
   *    更新，则会续失败。该字段在密码变更的时候自动更新
   *  - `email`：字符串，可选，未删除用户应当唯一
   *  - `wechatId`：字符串，可选，未删除用户应当唯一
   *  - `avatar`：字符串，可选，头像文件的位置（自动删除旧文件）
   *  - `avatarThumbnail64`：字符串，可选，64x64头像文件的位置（自动删除旧文件）
   *  - `createdAt`：创建时间，自动字段
   *  - `updatedAt`：更新时间，自动字段
   *  - `status`：数字，必要，状态，可通过静态成员`statusEnum`获得所有的状态
   *  - `roles`：数字，必要，权限，可通过静态成员`roleEnum`获得所有的权限，可通过位运算组合
   *  - `settings`：用户自定义的设置
   * @type {mongoose.Schema}
   */
  const userSchema = new mongoose.Schema({
    username: {type: String, required: true},
    password: {type: String, required: true},
    secureUpdatedAt: {type: Date},
    email: {type: String},
    wechatId: {type: String},
    nickname: {type: String},
    avatar: {type: String},
    avatarThumbnail64: {type: String},
    createdAt: {type: Date},
    updatedAt: {type: Date},
    status: {type: Number, required: true},
    roles: {type: Number},
    settings: {type: userSettingsSchema}
  });

  userSchema.index({username: 1}, {
    unique: true,
    partialFilterExpression: {
      status: {$lt: statusEnum.DELETED}
    }
  });
  userSchema.index({email: 1}, {
    unique: true,
    partialFilterExpression: {
      $and: [
        {email: {$exists: true}},
        {status: {$lt: statusEnum.DELETED}}
      ]
    }
  });
  userSchema.index({wechatId: 1}, {
    unique: true,
    partialFilterExpression: {
      $and: [
        {wechatId: {$exists: true}},
        {status: {$lt: statusEnum.DELETED}}
      ]
    }
  });
  userSchema.index({status: 1});

  userSchema.statics.statusEnum = statusEnum;
  userSchema.statics.roleEnum = roleEnum;

  addCreatedAt(userSchema);
  addCreatedAt(userSchema, 'secureUpdatedAt');
  addUpdatedAt(userSchema);
  addFileFields(userSchema, ['avatar', 'avatarThumbnail64'], config['upload-dir']);

  userSchema.methods.setPassword = async function (password) {
    this.password = password ? await bcrypt.hash(password, 10) : null;
    this.secureUpdatedAt = new Date();
  };
  userSchema.methods.checkPassword = async function (password) {
    if (!this.password)
      return false;
    return bcrypt.compare(password, this.password);
  };

  return db.model('users', userSchema);
};
