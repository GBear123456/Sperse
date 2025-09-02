const { OpenAI } = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

exports.handler = async (event) => {
  try {
    const { model, prompt, system } = JSON.parse(event.body);

    const completion = await openai.chat.completions.create({
      model: model || 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: system || 'You are a helpful assistant.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 4096,
      temperature: 0.5,
      top_p: 1,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ response: completion.choices[0].message.content })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
