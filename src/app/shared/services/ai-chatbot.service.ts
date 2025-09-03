import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AppConsts } from '@shared/AppConsts';

export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  isTyping?: boolean;
}

export interface ChatbotConfig {
  apiKey?: string;
  model?: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AiChatbotService {
  private messagesSubject = new BehaviorSubject<ChatMessage[]>([]);
  public messages$ = this.messagesSubject.asObservable();
  
  private isTypingSubject = new BehaviorSubject<boolean>(false);
  public isTyping$ = this.isTypingSubject.asObservable();

  private config: ChatbotConfig = {
    model: 'gpt-3.5-turbo',
    systemPrompt: `You are a helpful AI assistant for the Sperse CRM platform. You help new users understand how to use the system effectively. 
    
    Key areas you can help with:
    - CRM functionality (clients, leads, orders, products)
    - Dashboard navigation and widgets
    - Import/export features
    - Reports and analytics
    - User management and permissions
    - General platform guidance
    
    Always be friendly, concise, and provide actionable advice. If you don't know something specific about the platform, suggest where the user might find the information or contact support.`,
    maxTokens: 1000,
    temperature: 0.7
  };

  constructor(private http: HttpClient) {
    this.initializeWelcomeMessage();
  }

  private initializeWelcomeMessage(): void {
    const welcomeMessage: ChatMessage = {
      id: 'welcome',
      content: '👋 Hi! I\'m your AI assistant. I\'m here to help you get started with the Sperse CRM platform. What would you like to know?',
      role: 'assistant',
      timestamp: new Date()
    };
    
    this.messagesSubject.next([welcomeMessage]);
  }

  sendMessage(content: string): Observable<ChatMessage> {
    const userMessage: ChatMessage = {
      id: this.generateId(),
      content: content.trim(),
      role: 'user',
      timestamp: new Date()
    };

    // Add user message to the conversation
    const currentMessages = this.messagesSubject.value;
    this.messagesSubject.next([...currentMessages, userMessage]);

    // Show typing indicator
    this.isTypingSubject.next(true);

    // Prepare the request
    const requestBody = {
      model: this.config.model,
      messages: this.buildMessagesArray(content),
      max_tokens: this.config.maxTokens,
      temperature: this.config.temperature
    };

    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    // Use the existing Netlify function or create a new endpoint
    const apiUrl = this.getApiUrl();

    return this.http.post<any>(apiUrl, requestBody, { headers }).pipe(
      map(response => {
        this.isTypingSubject.next(false);
        
        const assistantMessage: ChatMessage = {
          id: this.generateId(),
          content: response.response || response.choices?.[0]?.message?.content || 'Sorry, I couldn\'t process your request.',
          role: 'assistant',
          timestamp: new Date()
        };

        // Add assistant response to the conversation
        const updatedMessages = this.messagesSubject.value;
        this.messagesSubject.next([...updatedMessages, assistantMessage]);

        return assistantMessage;
      }),
      catchError(error => {
        this.isTypingSubject.next(false);
        
        const errorMessage: ChatMessage = {
          id: this.generateId(),
          content: 'Sorry, I encountered an error. Please try again or contact support if the issue persists.',
          role: 'assistant',
          timestamp: new Date()
        };

        const updatedMessages = this.messagesSubject.value;
        this.messagesSubject.next([...updatedMessages, errorMessage]);

        throw error;
      })
    );
  }

  private buildMessagesArray(userMessage: string): any[] {
    const messages = [
      { role: 'system', content: this.config.systemPrompt }
    ];

    // Add recent conversation history (last 10 messages to stay within token limits)
    const recentMessages = this.messagesSubject.value.slice(-10);
    recentMessages.forEach(msg => {
      if (msg.role !== 'assistant' || !msg.content.includes('👋 Hi! I\'m your AI assistant')) {
        messages.push({
          role: msg.role,
          content: msg.content
        });
      }
    });

    return messages;
  }

  private getApiUrl(): string {
    // Use the existing Netlify function
    return '/.netlify/functions/openai';
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  clearConversation(): void {
    this.initializeWelcomeMessage();
  }

  updateConfig(newConfig: Partial<ChatbotConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): ChatbotConfig {
    return { ...this.config };
  }

  getQuickStartSuggestions(): string[] {
    return [
      'How do I add a new client?',
      'What is the dashboard for?',
      'How do I import leads?',
      'How do I create a product?',
      'What reports are available?',
      'How do I manage user permissions?'
    ];
  }
}
