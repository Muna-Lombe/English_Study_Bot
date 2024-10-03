const { Sequelize } = require('sequelize');
const { DATABASE_URL } = require('./config');

const sequelize = new Sequelize(DATABASE_URL, {
  dialect: 'postgres',
  logging: false
});

module.exports = sequelize;
