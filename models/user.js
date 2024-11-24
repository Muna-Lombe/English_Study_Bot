const { DataTypes } = require('sequelize')

module.exports = sequelize => {
  const User = sequelize.define(
    'User',
    {
      user_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      telegram_id: {
        type: DataTypes.STRING,
        unique: true
      },
      role: {
        type: DataTypes.STRING
      },
      name: {
        type: DataTypes.STRING
      },
      // Optional field to store the group IDs the user belongs to or is a teacher of
      group_ids: {
        type: DataTypes.ARRAY(DataTypes.STRING)
      }
    },
    {
      tableName: 'users',
      timestamps: false
    }
  )

  return User
}
