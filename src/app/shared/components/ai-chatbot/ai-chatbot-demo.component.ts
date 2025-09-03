import { Component, OnInit } from '@angular/core';
import { AiChatbotService } from '../../services/ai-chatbot.service';
import { AiChatbotConfigService } from '../../services/ai-chatbot-config.service';

@Component({
  selector: 'app-ai-chatbot-demo',
  template: `
    <div class="ai-chatbot-demo">
      <h3>AI Chatbot Demo</h3>
      <p>This component demonstrates how to interact with the AI chatbot programmatically.</p>
      
      <div class="demo-controls">
        <button (click)="sendTestMessage()" class="btn btn-primary">
          Send Test Message
        </button>
        <button (click)="clearConversation()" class="btn btn-secondary">
          Clear Conversation
        </button>
        <button (click)="toggleChatbot()" class="btn btn-info">
          Toggle Chatbot
        </button>
      </div>

      <div class="demo-info">
        <h4>Configuration:</h4>
        <ul>
          <li>Enabled: {{ configService.isEnabled() }}</li>
          <li>Model: {{ configService.getSettings().model }}</li>
          <li>Max Tokens: {{ configService.getSettings().maxTokens }}</li>
          <li>Temperature: {{ configService.getSettings().temperature }}</li>
        </ul>
      </div>
    </div>
  `,
  styles: [`
    .ai-chatbot-demo {
      padding: 20px;
      border: 1px solid #ddd;
      border-radius: 8px;
      margin: 20px 0;
    }
    
    .demo-controls {
      margin: 15px 0;
    }
    
    .demo-controls button {
      margin-right: 10px;
    }
    
    .demo-info {
      margin-top: 20px;
      padding: 15px;
      background: #f8f9fa;
      border-radius: 4px;
    }
    
    .demo-info ul {
      margin: 10px 0;
      padding-left: 20px;
    }
  `]
})
export class AiChatbotDemoComponent implements OnInit {

  constructor(
    private aiChatbotService: AiChatbotService,
    public configService: AiChatbotConfigService
  ) {}

  ngOnInit(): void {
    // Component initialization
  }

  sendTestMessage(): void {
    this.aiChatbotService.sendMessage('Hello! Can you help me understand how to use this CRM system?').subscribe({
      next: (response) => {
        console.log('Demo: AI Response received', response);
      },
      error: (error) => {
        console.error('Demo: Error sending message', error);
      }
    });
  }

  clearConversation(): void {
    this.aiChatbotService.clearConversation();
  }

  toggleChatbot(): void {
    // This would need to be implemented in the main chatbot component
    // For now, this is just a placeholder
    console.log('Toggle chatbot functionality would be implemented here');
  }
}
