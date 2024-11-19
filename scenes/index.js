const { Scenes } = require('telegraf');
const { privateScene } = require('./privateScene');
const { groupScene } = require('./groupScene');
const { teacherScene } = require('./teacherScene');
const { studentScene } = require('./studentScene');

const stage = new Scenes.Stage([
  privateScene,
  groupScene,
  teacherScene,
  studentScene
]);

module.exports = stage;