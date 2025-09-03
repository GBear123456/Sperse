# AI Chatbot Integration Setup Guide

This guide will help you set up the AI chatbot for new user guidance in your Angular project.

## Features

- 🤖 AI-powered chatbot using OpenAI GPT models
- 💬 Real-time conversation with typing indicators
- 🎯 Quick start suggestions for new users
- 🎨 Beautiful, responsive UI that matches your theme
- 📱 Mobile-friendly design
- 🌙 Dark/light theme support
- ⚙️ Configurable settings and prompts

## Prerequisites

1. **OpenAI API Key**: You need an OpenAI API key to use the chatbot
2. **Netlify Functions**: The project uses Netlify functions for API calls
3. **Angular 12+**: The chatbot is built for Angular 12.2.14

## Setup Instructions

### 1. Environment Configuration

Add your OpenAI API key to your Netlify environment variables:

```bash
# In your Netlify dashboard or netlify.toml
OPENAI_API_KEY=your_openai_api_key_here
```

### 2. Install Dependencies

The required dependencies are already included in the project:

```bash
npm install @neurodevworks/angular-chatbot @neurodevworks/chatbot-core
```

### 3. Component Integration

The AI chatbot component has been integrated into your main app:

- **Service**: `src/app/shared/services/ai-chatbot.service.ts`
- **Component**: `src/app/shared/components/ai-chatbot/`
- **Module**: `src/app/shared/components/ai-chatbot/ai-chatbot.module.ts`
- **Configuration**: `src/app/shared/services/ai-chatbot-config.service.ts`

### 4. Usage

The chatbot will automatically appear as a floating button in the bottom-right corner of your application. Users can:

- Click the robot icon to open the chatbot
- Ask questions about the platform
- Use quick start suggestions
- Minimize/maximize the chat window
- Clear conversation history

## Customization

### System Prompt

You can customize the AI's behavior by modifying the system prompt in `ai-chatbot-config.service.ts`:

```typescript
systemPrompt: `Your custom system prompt here...`
```

### Quick Suggestions

Modify the quick start suggestions in the same file:

```typescript
quickSuggestions: [
  'Your custom suggestion 1',
  'Your custom suggestion 2',
  // ...
]
```

### Styling

The chatbot uses CSS variables for theming, so it automatically adapts to your light/dark theme. You can customize colors by modifying the CSS variables in `ai-chatbot.component.less`.

### Configuration Options

Available settings in `AiChatbotSettings`:

- `enabled`: Enable/disable the chatbot
- `showOnNewUser`: Show welcome message for new users
- `welcomeMessage`: Custom welcome message
- `systemPrompt`: AI behavior instructions
- `model`: OpenAI model to use (gpt-3.5-turbo, gpt-4, etc.)
- `maxTokens`: Maximum response length
- `temperature`: Response creativity (0-1)
- `quickSuggestions`: Array of quick start suggestions

## API Integration

The chatbot uses the existing Netlify function at `netlify/functions/openai.js` which has been updated to handle the new chatbot requests with proper CORS support.

### Request Format

```typescript
{
  model: 'gpt-3.5-turbo',
  messages: [
    { role: 'system', content: 'System prompt...' },
    { role: 'user', content: 'User message...' }
  ],
  max_tokens: 1000,
  temperature: 0.7
}
```

### Response Format

```typescript
{
  response: 'AI response text...',
  usage: { /* token usage info */ }
}
```

## Security Considerations

1. **API Key**: Never expose your OpenAI API key in client-side code
2. **Rate Limiting**: Consider implementing rate limiting for production use
3. **Input Validation**: The service includes basic input validation
4. **CORS**: Proper CORS headers are configured in the Netlify function

## Troubleshooting

### Common Issues

1. **Chatbot not appearing**: Check if the component is properly imported in `app.module.ts`
2. **API errors**: Verify your OpenAI API key is set correctly in Netlify
3. **Styling issues**: Ensure CSS variables are properly defined in your theme
4. **CORS errors**: Check that the Netlify function is deployed and accessible

### Debug Mode

Enable console logging by adding this to your component:

```typescript
// In ai-chatbot.component.ts
console.log('AI Response:', response);
```

## Performance Optimization

1. **Message History**: Only the last 10 messages are sent to the API to manage token usage
2. **Lazy Loading**: The chatbot component is loaded on demand
3. **Caching**: Settings are cached in localStorage
4. **Debouncing**: Input is debounced to prevent excessive API calls

## Future Enhancements

Potential improvements you could add:

- Conversation persistence across sessions
- File upload support for document analysis
- Multi-language support
- Integration with your existing help documentation
- Analytics and usage tracking
- Custom AI models or fine-tuning

## Support

If you encounter any issues:

1. Check the browser console for errors
2. Verify your OpenAI API key and quota
3. Ensure all dependencies are properly installed
4. Check that the Netlify function is deployed correctly

The chatbot is designed to be robust and handle errors gracefully, providing fallback responses when the API is unavailable.
