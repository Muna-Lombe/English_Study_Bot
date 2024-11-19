const { DataTypes } = require('sequelize');
const sequelize = require('../database');

module.exports = (sequelize, DataTypes) => {
  const Material = sequelize.define(
    'Material',
    {
      material_id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUID
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
      },
      exercise_type: {
        type: DataTypes.STRING,
        allowNull: false
      },
      quiz_data: {
        type: DataTypes.JSONB,
        allowNull: true
      },
      vocab_data: {
        type: DataTypes.JSONB,
        allowNull: true
      },
      trivia_data: {
        type: DataTypes.JSONB,
        allowNull: true
      },
      media_file_id: {
        type: DataTypes.STRING,
        allowNull: true
      }
    },
    {
      tableName: 'materials',
      timestamps: false
    }
  )

  return Material
}


