const { Scenes } = require('telegraf');
const { privateTeacherScene } = require('./privateTeacherScene');
const { privateStudentScene } = require('./privateStudentScene');
const { groupTeacherScene } = require('./groupTeacherScene');
const { groupStudentScene } = require('./groupStudentScene');
const { guestScene } = require('./guestScene');

const stage = new Scenes.Stage([
  privateTeacherScene,
  privateStudentScene,
  groupTeacherScene,
  groupStudentScene,
  guestScene
]);

module.exports = stage;