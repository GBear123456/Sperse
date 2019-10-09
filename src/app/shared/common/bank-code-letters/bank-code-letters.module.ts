/** Core imoports */
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

/** Third party imports */
import { DragulaModule } from 'ng2-dragula';
import { DxTooltipModule } from 'devextreme-angular/ui/tooltip';
import { MatDialogModule } from '@angular/material/dialog';

/** Application imports */
import { BankCodeLetterComponent } from '@app/shared/common/bank-code-letters/bank-code-letter/bank-code-letter.component';
import { BankCodeLettersComponent } from '@app/shared/common/bank-code-letters/bank-code-letters.component';
import { BankCodeService } from '@app/shared/common/bank-code/bank-code.service';
import { BankCodeLettersEditorDialogComponent } from './bank-code-letters-editor-dialog/bank-code-letters-editor-dialog.component';

@NgModule({
    imports: [
        CommonModule,
        DxTooltipModule,
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
        BankCodeService
    ],
    entryComponents: [
        BankCodeLettersEditorDialogComponent
    ]
})
export class BankCodeLettersModule {}
