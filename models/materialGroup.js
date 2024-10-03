const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const MaterialGroup = sequelize.define('MaterialGroup', {
  material_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'materials',
      key: 'material_id'
    }
  },
  group_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'groups',
      key: 'group_id'
    }
  }
}, {
  tableName: 'material_groups',
  timestamps: false
});

module.exports = MaterialGroup;
