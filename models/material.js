const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Material = sequelize.define('Material', {
  material_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  teacher_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'user_id'
    }
  },
  content: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'materials',
  timestamps: false
});

module.exports = Material;
