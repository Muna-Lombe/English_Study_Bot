const sequelize = require('../database');
const User = require('./user');
const Material = require('./material');
const Group = require('./group');
const MaterialGroup = require('./materialGroup');

// Define associations
Material.belongsTo(User, { foreignKey: 'teacher_id' });
Group.belongsTo(User, { foreignKey: 'teacher_id' });

Material.belongsToMany(Group, { through: MaterialGroup, foreignKey: 'material_id' });
Group.belongsToMany(Material, { through: MaterialGroup, foreignKey: 'group_id' });

module.exports = {
  sequelize,
  User,
  Material,
  Group,
  MaterialGroup
};
