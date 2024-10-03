const fetch = require('node-fetch');
const { OPENAI_API_KEY } = require('../config');

module.exports = {
  getAnswer: async (question, context) => {
    const prompt = `Context: ${context}\nQuestion: ${question}\nAnswer:`;
    const response = await fetch('https://api.openai.com/v1/engines/davinci/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        prompt: prompt,
        max_tokens: 150,
        temperature: 0.7,
        n: 1,
        stop: ['\n']
      })
    });
    const data = await response.json();
    return data.choices[0].text.trim();
  }
};
