const { Sequelize } = require('sequelize')
const { DATABASE_URL } = require('./config')

const sequelize = new Sequelize(DATABASE_URL, {
  dialect: 'postgres',
  logging: console.log
})

// sequelize.sync() // create the database table for our model(s)
// // .then(function () {
// //   // do some work
// // })
// .then(function () {
//   return sequelize.drop() // drop all tables in the db
// })

module.exports = sequelize
