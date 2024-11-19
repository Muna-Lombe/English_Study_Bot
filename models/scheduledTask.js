// models/scheduledTask.js

module.exports = (sequelize, DataTypes) => {
  const ScheduledTask = sequelize.define(
    'ScheduledTask',
    {
      task_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      teacher_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'user_id',
        },
      },
      material_id: {
        type: DataTypes.UUID, // Ensure this matches the type in the Material model
        allowNull: false,
        references: {
          model: 'materials',
          key: 'material_id',
        },
      },
      scheduled_time: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      executed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      tableName: 'scheduled_tasks',
      timestamps: false,
    }
  );

  return ScheduledTask
}
