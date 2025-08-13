import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { TenantSettingsServiceProxy } from '@shared/service-proxies/service-proxies';

export interface OpenAIMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface OpenAIRequest {
    model: string;
    messages: OpenAIMessage[];
    max_tokens?: number;
    temperature?: number;
    top_p?: number;
}

export interface OpenAIResponse {
    choices: Array<{
        message: {
            content: string;
        };
    }>;
}

@Injectable({
    providedIn: 'root'
})
export class OpenAIService {
    private readonly OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

    constructor(
        private http: HttpClient,
        private tenantSettingsService: TenantSettingsServiceProxy
    ) {}

    /**
     * Generate content using OpenAI API
     * @param request The OpenAI API request
     * @returns Observable with the OpenAI response
     */
    generateContent(request: OpenAIRequest): Observable<OpenAIResponse> {
        return from(this.makeOpenAIRequest(request));
    }

    /**
     * Generate email content using OpenAI API
     * @param prompt The user prompt
     * @param model The AI model to use
     * @returns Observable with the generated content
     */
    generateEmailContent(prompt: string, model: string = 'gpt-3.5-turbo'): Observable<OpenAIResponse> {
        const request: OpenAIRequest = {
            model,
            messages: [
                {
                    role: 'system',
                    content: 'You are an expert email marketer. Your task is to create compelling email content with the html based on user input.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            max_tokens: 4096,
            temperature: 0.5,
            top_p: 1,
        };

        return this.generateContent(request);
    }

    /**
     * Check if OpenAI API key is configured
     * @returns Observable with boolean indicating if API key is configured
     */
    isApiKeyConfigured(): Observable<boolean> {
        return from(this.checkApiKeyConfiguration());
    }

    /**
     * Make the actual OpenAI API request
     */
    private async makeOpenAIRequest(request: OpenAIRequest): Promise<OpenAIResponse> {
        const aiSettings = await this.tenantSettingsService.getAIIntegrationSettings().toPromise();
        
        if (!aiSettings?.openAIApiKey) {
            throw new Error('OpenAI API key is not configured. Please configure it in the AI Integration Settings.');
        }

        const headers = new HttpHeaders({
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${aiSettings.openAIApiKey}`
        });

        try {
            const response = await fetch(this.OPENAI_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${aiSettings.openAIApiKey}`,
                },
                body: JSON.stringify(request),
            });

            if (!response.ok) {
                throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('OpenAI API request failed:', error);
            throw error;
        }
    }

    /**
     * Check if API key is configured
     */
    private async checkApiKeyConfiguration(): Promise<boolean> {
        try {
            const aiSettings = await this.tenantSettingsService.getAIIntegrationSettings().toPromise();
            return !!aiSettings?.openAIApiKey;
        } catch (error) {
            console.error('Failed to check API key configuration:', error);
            return false;
        }
    }

    /**
     * Get user-friendly error message based on error
     */
    getErrorMessage(error: any): string {
        if (error.message.includes('401')) {
            return 'Invalid OpenAI API key. Please check your configuration.';
        } else if (error.message.includes('429')) {
            return 'Rate limit exceeded. Please try again later.';
        } else if (error.message.includes('500')) {
            return 'OpenAI service error. Please try again later.';
        } else if (error.message.includes('OpenAI API key is not configured')) {
            return 'OpenAI API key is not configured. Please configure it in the AI Integration Settings.';
        }
        return 'Failed to generate AI response. Please try again.';
    }
}
