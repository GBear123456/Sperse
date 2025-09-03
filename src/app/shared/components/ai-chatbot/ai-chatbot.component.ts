import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AiChatbotService, ChatMessage } from '../../services/ai-chatbot.service';

@Component({
  selector: 'app-ai-chatbot',
  templateUrl: './ai-chatbot.component.html',
  styleUrls: ['./ai-chatbot.component.less']
})
export class AiChatbotComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('messageContainer', { static: false }) messageContainer!: ElementRef;
  @ViewChild('messageInput', { static: false }) messageInput!: ElementRef;

  messages: ChatMessage[] = [];
  isTyping = false;
  isOpen = false;
  isMinimized = false;
  currentMessage = '';
  quickSuggestions: string[] = [];
  showSuggestions = true;

  private destroy$ = new Subject<void>();

  constructor(private aiChatbotService: AiChatbotService) {}

  ngOnInit(): void {
    this.quickSuggestions = this.aiChatbotService.getQuickStartSuggestions();
    
    // Subscribe to messages
    this.aiChatbotService.messages$
      .pipe(takeUntil(this.destroy$))
      .subscribe((messages: ChatMessage[]) => {
        this.messages = messages;
        this.scrollToBottom();
      });

    // Subscribe to typing indicator
    this.aiChatbotService.isTyping$
      .pipe(takeUntil(this.destroy$))
      .subscribe((isTyping: boolean) => {
        this.isTyping = isTyping;
        if (isTyping) {
          this.scrollToBottom();
        }
      });
  }

  ngAfterViewInit(): void {
    // Auto-focus input when chatbot opens
    if (this.isOpen && this.messageInput) {
      this.messageInput.nativeElement.focus();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleChatbot(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.isMinimized = false;
      setTimeout(() => {
        if (this.messageInput) {
          this.messageInput.nativeElement.focus();
        }
      }, 100);
    }
  }

  minimizeChatbot(): void {
    this.isMinimized = true;
  }

  maximizeChatbot(): void {
    this.isMinimized = false;
    setTimeout(() => {
      if (this.messageInput) {
        this.messageInput.nativeElement.focus();
      }
    }, 100);
  }

  sendMessage(): void {
    if (!this.currentMessage.trim() || this.isTyping) {
      return;
    }

    const message = this.currentMessage.trim();
    this.currentMessage = '';
    this.showSuggestions = false;

    this.aiChatbotService.sendMessage(message).subscribe({
      next: (response) => {
        // Message is already added to the conversation in the service
        console.log('AI Response:', response);
      },
      error: (error) => {
        console.error('Error sending message:', error);
      }
    });
  }

  sendQuickSuggestion(suggestion: string): void {
    this.currentMessage = suggestion;
    this.sendMessage();
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  clearConversation(): void {
    this.aiChatbotService.clearConversation();
    this.showSuggestions = true;
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      if (this.messageContainer) {
        const element = this.messageContainer.nativeElement;
        element.scrollTop = element.scrollHeight;
      }
    }, 100);
  }

  formatMessage(content: string): string {
    // Simple formatting for better readability
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  }

  getMessageTime(timestamp: Date): string {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }
}
