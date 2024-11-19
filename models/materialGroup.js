const { DataTypes } = require('sequelize');
const sequelize = require('../database');

module.exports = sequelize => {
  const MaterialGroup = sequelize.define(
    'MaterialGroup',
    {
      material_id: {
        type: DataTypes.UUID,
        references: {
          model: 'materials',
          key: 'material_id'
        },
        primaryKey: true
      },
      group_id: {
        type: DataTypes.INTEGER,
        references: {
          model: 'groups',
          key: 'group_id'
        },
        primaryKey: true
      }
    },
    {
      tableName: 'material_groups',
      timestamps: false
    }
  )

  return MaterialGroup
}

