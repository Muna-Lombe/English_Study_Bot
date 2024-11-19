const { DataTypes } = require('sequelize')

module.exports = sequelize => {
  const Group = sequelize.define(
    'Group',
    {
      group_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      chat_id: {
        type: DataTypes.STRING,
        unique: true
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
      },
       type: {
        type: DataTypes.STRING
      },
      member_count: {
        type: DataTypes.INTEGER
      },
      invite_link: {
        type: DataTypes.STRING,
        allowNull: true
      }
    },
    {
      tableName: 'groups',
      timestamps: false
    }
  )

  return Group
}
