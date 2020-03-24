/** Core imoports */
import { NgModule } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';

/** Third party imports */
import { MatDialogModule } from '@angular/material/dialog';
import { DragulaModule } from 'ng2-dragula';
import { DxTooltipModule } from 'devextreme-angular/ui/tooltip';
import { DxRadioGroupModule } from 'devextreme-angular/ui/radio-group';
import { DxPopupModule } from 'devextreme-angular/ui/popup';
import { DxSelectBoxModule } from 'devextreme-angular/ui/select-box';

/** Application imports */
import { BankCodeLetterComponent } from '@app/shared/common/bank-code-letters/bank-code-letter/bank-code-letter.component';
import { BankCodeLettersComponent } from '@app/shared/common/bank-code-letters/bank-code-letters.component';
import { BankCodeService } from '@app/shared/common/bank-code/bank-code.service';
import { BankCodeLettersEditorDialogComponent } from './bank-code-letters-editor-dialog/bank-code-letters-editor-dialog.component';

@NgModule({
    imports: [
        CommonModule,
        DxTooltipModule,
        DxPopupModule,
        DxRadioGroupModule,
        DxSelectBoxModule,
        MatDialogModule,
        DragulaModule
    ],
    declarations: [
        BankCodeLettersComponent,
        BankCodeLetterComponent,
        BankCodeLettersEditorDialogComponent
    ],
    exports: [
        BankCodeLetterComponent,
        BankCodeLettersComponent
    ],
    providers: [
        BankCodeService,
        DecimalPipe
    ],
    entryComponents: [
        BankCodeLettersEditorDialogComponent
    ]
})
export class BankCodeLettersModule {}
