/** Core imports */
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

/** Third party imports */
import { DxTextAreaModule } from 'devextreme-angular/ui/text-area';
import { DxTextBoxModule } from 'devextreme-angular/ui/text-box';
import { DxValidatorModule } from 'devextreme-angular/ui/validator';
import { DxButtonModule } from 'devextreme-angular/ui/button';
import { ClipboardModule } from 'ngx-clipboard';

/** Application imports */
import { InplaceEditComponent } from './inplace-edit.component';

@NgModule({
    imports: [
        CommonModule,
        DxTextAreaModule,
        DxValidatorModule,
        DxTextBoxModule,
        DxButtonModule,
        ClipboardModule
    ],
    exports: [
        InplaceEditComponent
    ],
    declarations: [ InplaceEditComponent ],
    providers: [],
})
export class InplaceEditModule {}
