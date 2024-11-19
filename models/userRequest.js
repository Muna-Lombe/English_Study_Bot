const { DataTypes } = require('sequelize')

module.exports = sequelize => {
  const UserRequest = sequelize.define(
    'UserRequest', {
    request_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'users',
        key: 'user_id'
      }
    },
    type: {
      type: DataTypes.STRING, // 'BOT_JOIN_CHAT'
      allowNull: false
    },
    status: {
      type: DataTypes.STRING, // 'PENDING', 'COMPLETED', 'EXPIRED'
      defaultValue: 'PENDING'
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false
    }
  })

  return UserRequest
}
