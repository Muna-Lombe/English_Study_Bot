const { Scenes } = require('telegraf');
const { privateTeacherScene } = require('./privateTeacherScene');
const { privateStudentScene } = require('./privateStudentScene');
const { groupTeacherScene } = require('./groupTeacherScene');
const { groupStudentScene } = require('./groupStudentScene');
const { guestScene } = require('./guestScene');
const { privateScene } = require('./privateScene');
const { groupScene } = require('./groupScene');

const stage = new Scenes.Stage([
  privateTeacherScene,
  privateStudentScene,
  groupTeacherScene,
  groupStudentScene,
  privateScene,
  groupScene,
  guestScene
]);

module.exports = stage;