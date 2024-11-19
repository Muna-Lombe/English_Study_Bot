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
      }
    },
    {
      tableName: 'users',
      timestamps: false
    }
  )

  return User
}
