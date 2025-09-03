import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AiChatbotComponent } from './ai-chatbot.component';

@NgModule({
  declarations: [
    AiChatbotComponent
  ],
  imports: [
    CommonModule,
    FormsModule
  ],
  exports: [
    AiChatbotComponent
  ]
})
export class AiChatbotModule { }
