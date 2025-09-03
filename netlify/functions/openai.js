const { OpenAI } = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

exports.handler = async (event) => {
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  try {
    const requestBody = JSON.parse(event.body);
    const { model, messages, max_tokens, temperature } = requestBody;

    // Validate required fields
    if (!messages || !Array.isArray(messages)) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Messages array is required' })
      };
    }

    const completion = await openai.chat.completions.create({
      model: model || 'gpt-3.5-turbo',
      messages: messages,
      max_tokens: max_tokens || 1000,
      temperature: temperature || 0.7,
    });

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        response: completion.choices[0].message.content,
        usage: completion.usage
      })
    };
  } catch (err) {
    console.error('OpenAI API Error:', err);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        error: err.message || 'An error occurred while processing your request'
      })
    };
  }
};
