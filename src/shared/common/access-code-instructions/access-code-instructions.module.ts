import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AccessCodeInstructionsComponent } from './access-code-instructions.component';
import { ClipboardModule } from 'ngx-clipboard';

@NgModule({
    imports: [ CommonModule, ClipboardModule ],
    exports: [ AccessCodeInstructionsComponent ],
    declarations: [ AccessCodeInstructionsComponent ],
    providers: [],
})
export class AccessCodeInstructionsModule {}
