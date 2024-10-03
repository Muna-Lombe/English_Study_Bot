const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Group = sequelize.define('Group', {
  group_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  chat_id: {
    type: DataTypes.STRING
  },
  name: {
    type: DataTypes.STRING
  },
  teacher_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'user_id'
    }
  }
}, {
  tableName: 'groups',
  timestamps: false
});

module.exports = Group;
