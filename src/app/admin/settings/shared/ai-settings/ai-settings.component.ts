/** Core imports */
import { Component, ChangeDetectionStrategy, Injector } from '@angular/core';

/** Third party imports */
import { Observable } from '@node_modules/rxjs';

/** Application imports */
import { SettingsComponentBase } from '../settings-base.component';
import { Info, Zap } from 'lucide-angular';

@Component({
    selector: 'ai-settings',
    templateUrl: 'ai-settings.component.html',
    styleUrls: [ 'ai-settings.component.less', '../settings-base.less' ],
    providers: [ ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AISettingsComponent extends SettingsComponentBase {
    readonly ZapIcon = Zap;
    readonly InfoIcon = Info;

    openAISecretKeyTooltip: string = 'Your organization-wide OpenAI API key for all platform features.';
    openAIKeyModelTooltip: string = 'Determine how API keys are used throughout the platform.';
    personalOpenAIKeyTooltip: string = 'Controls whether users are required to provide their own API keys.';
    activateOpenAIStandardTooltip: string = 'Enable standard quality text-to-speech voices from OpenAI.';
    activateOpenAINeuralTooltip: string = 'Enable premium quality neural text-to-speech voices from OpenAI.';
    anthropicAPIKeyTooltip: string = 'Your organization-wide Anthropic API key for Claude and other Anthropic models.';
    geminiAPIKeyTooltip: string = 'Your organization-wide Google AI API key for Gemini models.';
    stableDiffusionAPIKeyTooltip: string = "Your organization-wide Stable Diffusion API key for image generation features.";
    sdAPIModelTooltip: string = "Determine how Stable Diffusion API keys are used throughout the platform.";
    personalStableDiffusionKeyTooltip: string = "Controls whether users are required to provide their own Stable Diffusion API keys.";
    elevenLabsAPIKeyTooltip: string = "Your organization-wide ElevenLabs API key for text-to-speech features.";
    activateElevenLabsTooltip: string = "Enable high-quality text-to-speech voices from Eleven Labs.";
    
    openAIAPIKeyModels = [
        {
            ID: 1,
            name: "Only Main API Key",
            value: 'only main'
        },
        {
            ID: 2,
            name: "User Keys with Main Key Fallback",
            value: 'with main'
        },
        {
            ID: 3,
            name: "Only User API Keys",
            value: 'only user'
        },
    ]
    constructor(
        _injector: Injector
    ) {
        super(_injector);
    }

    getSaveObs(): Observable<any> {
        return;
    }
}