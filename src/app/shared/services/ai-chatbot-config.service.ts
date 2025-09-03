import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface AiChatbotSettings {
  enabled: boolean;
  showOnNewUser: boolean;
  welcomeMessage: string;
  systemPrompt: string;
  model: string;
  maxTokens: number;
  temperature: number;
  quickSuggestions: string[];
}

@Injectable({
  providedIn: 'root'
})
export class AiChatbotConfigService {
  private settingsSubject = new BehaviorSubject<AiChatbotSettings>(this.getDefaultSettings());
  public settings$ = this.settingsSubject.asObservable();

  private readonly STORAGE_KEY = 'ai-chatbot-settings';

  constructor() {
    this.loadSettings();
  }

  private getDefaultSettings(): AiChatbotSettings {
    return {
      enabled: true,
      showOnNewUser: true,
      welcomeMessage: '👋 Hi! I\'m your AI assistant. I\'m here to help you get started with the Sperse CRM platform. What would you like to know?',
      systemPrompt: `You are a helpful AI assistant for the Sperse CRM platform. You help new users understand how to use the system effectively. 
      
      Key areas you can help with:
      - CRM functionality (clients, leads, orders, products)
      - Dashboard navigation and widgets
      - Import/export features
      - Reports and analytics
      - User management and permissions
      - General platform guidance
      
      Always be friendly, concise, and provide actionable advice. If you don't know something specific about the platform, suggest where the user might find the information or contact support.`,
      model: 'gpt-3.5-turbo',
      maxTokens: 1000,
      temperature: 0.7,
      quickSuggestions: [
        'How do I add a new client?',
        'What is the dashboard for?',
        'How do I import leads?',
        'How do I create a product?',
        'What reports are available?',
        'How do I manage user permissions?'
      ]
    };
  }

  private loadSettings(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsedSettings = JSON.parse(stored);
        this.settingsSubject.next({ ...this.getDefaultSettings(), ...parsedSettings });
      }
    } catch (error) {
      console.warn('Failed to load AI chatbot settings:', error);
    }
  }

  updateSettings(settings: Partial<AiChatbotSettings>): void {
    const currentSettings = this.settingsSubject.value;
    const newSettings = { ...currentSettings, ...settings };
    
    this.settingsSubject.next(newSettings);
    
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.warn('Failed to save AI chatbot settings:', error);
    }
  }

  getSettings(): AiChatbotSettings {
    return this.settingsSubject.value;
  }

  resetToDefaults(): void {
    const defaultSettings = this.getDefaultSettings();
    this.settingsSubject.next(defaultSettings);
    
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(defaultSettings));
    } catch (error) {
      console.warn('Failed to reset AI chatbot settings:', error);
    }
  }

  isEnabled(): boolean {
    return this.settingsSubject.value.enabled;
  }

  shouldShowOnNewUser(): boolean {
    return this.settingsSubject.value.showOnNewUser;
  }
}
