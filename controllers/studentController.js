const { Group, Material } = require('../models')
const aiService = require('../services/aiService')

module.exports = {
  handleStudentQuestion: async (ctx, question) => {
    const chatId = ctx.chat.id.toString()

    try {
      const group = await Group.findOne({ where: { chat_id: chatId } })
      if (group) {
        const materials = await group.getMaterials({
          where: { exercise_type: 'q&a' },
          order: [['createdAt', 'DESC']],
          limit: 1
        })

        if (materials && materials.length > 0) {
          const material = materials[0]
          const answer = await aiService.getAnswer(question, material.content)
          await ctx.reply(answer)
        } else {
          await ctx.reply('No Q&A materials are available at the moment.')
        }
      } else {
        await ctx.reply('This group is not registered.')
      }
    } catch (err) {
      console.error('Error in handleStudentQuestion:', err)
      await ctx.reply('An error occurred while processing your question.')
    }
  },

  startQuiz: async ctx => {
    const chatId = ctx.chat.id.toString()
    const group = await Group.findOne({ where: { chat_id: chatId } })

    if (group) {
      const materials = await group.getMaterials({
        where: { exercise_type: 'quiz' },
        order: [['createdAt', 'DESC']],
        limit: 1
      })

      if (materials && materials.length > 0) {
        const quiz = materials[0]
        const quizData = quiz.quiz_data

        // Send each question as a poll
        for (const question of quizData.questions) {
          await ctx.telegram.sendPoll(
            ctx.chat.id,
            question.question,
            question.options,
            {
              type: 'quiz',
              correct_option_id: question.correct_option_id,
              is_anonymous: false // Set to true if you want anonymous polls
            }
          )
        }
      } else {
        await ctx.reply('No quizzes available at the moment.')
      }
    } else {
      await ctx.reply('This group is not registered.')
    }
  },

  startVocabularyTraining: async ctx => {
    const chatId = ctx.chat.id.toString()
    const group = await Group.findOne({ where: { chat_id: chatId } })

    if (group) {
      const materials = await group.getMaterials({
        where: { exercise_type: 'vocabulary' },
        order: [['createdAt', 'DESC']],
        limit: 1
      })

      if (materials && materials.length > 0) {
        const vocabList = materials[0].vocab_data
        ctx.session.vocabList = vocabList
        ctx.session.vocabIndex = 0
        await sendVocabularyWord(ctx)
      } else {
        await ctx.reply('No vocabulary exercises available at the moment.')
      }
    } else {
      await ctx.reply('This group is not registered.')
    }
  },
  startMemeQuiz : async ctx => {
    const chatId = ctx.chat.id.toString()
    const group = await Group.findOne({ where: { chat_id: chatId } })

    if (group) {
      const materials = await group.getMaterials({
        where: { exercise_type: 'meme' },
        order: [['createdAt', 'DESC']],
        limit: 1
      })

      if (materials && materials.length > 0) {
        const material = materials[0]
        // Send the meme image or sticker
        if (material.media_file_id) {
          await ctx.replyWithPhoto(material.media_file_id)
          // Ask the students to guess the meme
          await ctx.reply('Can you guess the meme?')
        } else {
          await ctx.reply('No media found for this exercise.')
        }
      } else {
        await ctx.reply('No "Know Your Meme" exercises available at the moment.')
      }
    } else {
      await ctx.reply('This group is not registered.')
    }
  },
  startPictureQuiz : async ctx => {
    // Similar implementation for picture quizzes
    const chatId = ctx.chat.id.toString()
    const group = await Group.findOne({ where: { chat_id: chatId } })

    if (group) {
      const materials = await group.getMaterials({
        where: { exercise_type: 'picture_quiz' },
        order: [['createdAt', 'DESC']],
        limit: 1
      })

      if (materials && materials.length > 0) {
        const material = materials[0]
        // Send the meme image or sticker
        if (material.media_file_id) {
          await ctx.replyWithPhoto(material.media_file_id)
          // Ask the students to guess the meme
          await ctx.reply('Can you guess the picture?')
        } else {
          await ctx.reply('No media found for this exercise.')
        }
      } else {
        await ctx.reply('No "Know Your Picture" exercises available at the moment.')
      }
    } else {
      await ctx.reply('This group is not registered.')
    }
  },
  startWorldTrivia : async (ctx) => {
    const chatId = ctx.chat.id.toString();
    const group = await Group.findOne({ where: { chat_id: chatId } });

    if (group) {
      const materials = await group.getMaterials({
        where: { exercise_type: 'world_trivia' },
        order: [['createdAt', 'DESC']],
        limit: 1,
      });

      if (materials && materials.length > 0) {
        const material = materials[0];
        const triviaData = material.trivia_data;

        // Send each trivia question as a poll
        for (const question of triviaData.questions) {
          await ctx.telegram.sendPoll(
            ctx.chat.id,
            question.question,
            question.options,
            {
              type: 'quiz',
              correct_option_id: question.correct_option_id,
              is_anonymous: false,
            }
          );
        }
      } else {
        await ctx.reply('No world trivia available at the moment.');
      }
    } else {
      await ctx.reply('This group is not registered.');
    }
  },
  handleStudentQuestion: async (ctx, question) => {
    const chatId = ctx.chat.id.toString();

    try {
      const group = await Group.findOne({ where: { chat_id: chatId } });
      if (group) {
        const materials = await group.getMaterials({
          where: { exercise_type: 'q&a' },
          order: [['createdAt', 'DESC']],
          limit: 1,
        });

        if (materials && materials.length > 0) {
          const material = materials[0];
          const answer = await aiService.getAnswer(question, material.content);
          await ctx.reply(answer, { reply_to_message_id: ctx.message.message_id });
        } else {
          await ctx.reply('No Q&A materials are available at the moment.', { reply_to_message_id: ctx.message.message_id });
        }
      } else {
        await ctx.reply('This group is not registered.', { reply_to_message_id: ctx.message.message_id });
      }
    } catch (err) {
      console.error('Error in handleStudentQuestion:', err);
      await ctx.reply('An error occurred while processing your question.', { reply_to_message_id: ctx.message.message_id });
    }
  },
}

async function sendQuizQuestion (ctx) {
  const quiz = ctx.session.quiz
  const index = ctx.session.quizIndex

  if (index < quiz.questions.length) {
    const question = quiz.questions[index]
    ctx.session.currentAnswer = question.answer

    await ctx.reply(question.question, {
      reply_markup: {
        inline_keyboard: question.options.map(option => [
          { text: option, callback_data: `quizAnswer_${option}` }
        ])
      }
    })
  } else {
    await ctx.reply('Quiz completed! Great job!')
    ctx.session.quiz = null
    ctx.session.quizIndex = null
    ctx.session.currentAnswer = null
  }
}

async function sendVocabularyWord (ctx) {
  const vocabList = ctx.session.vocabList
  const index = ctx.session.vocabIndex

  if (index < vocabList.length) {
    const word = vocabList[index]
    await ctx.reply(`Define: *${word.term}*`, { parse_mode: 'Markdown' })
    ctx.session.vocabIndex += 1
  } else {
    await ctx.reply('Vocabulary training completed! Well done!')
    ctx.session.vocabList = null
    ctx.session.vocabIndex = null
  }
}
