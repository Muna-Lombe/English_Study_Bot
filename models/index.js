// models/index.js
const { DataTypes } = require('sequelize')
const sequelize = require('../database')
const User = require('./user')(sequelize)
const Material = require('./material')(sequelize,DataTypes)
const Group = require('./group')(sequelize)
const MaterialGroup = require('./materialGroup')(sequelize)
const ScheduledTask = require('./scheduledTask')(sequelize, DataTypes)
const UserRequest = require('./userRequest')(sequelize)

// Associations
User.hasMany(Material, { foreignKey: 'teacher_id' })
Material.belongsTo(User, { foreignKey: 'teacher_id' })

User.hasMany(Group, { foreignKey: 'teacher_id' })
Group.belongsTo(User, { foreignKey: 'teacher_id' })

Material.belongsToMany(Group, {
  through: MaterialGroup,
  foreignKey: 'material_id'
})
Group.belongsToMany(Material, {
  through: MaterialGroup,
  foreignKey: 'group_id'
})
ScheduledTask.belongsTo(User, { foreignKey: 'teacher_id' })
ScheduledTask.belongsTo(Material, { foreignKey: 'material_id' })

UserRequest.belongsTo(User, { foreignKey: 'user_id' })


module.exports = {
  sequelize,
  User,
  Material,
  Group,
  MaterialGroup,
  UserRequest,
  ScheduledTask,
}
