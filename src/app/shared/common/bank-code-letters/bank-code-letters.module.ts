/** Core imoports */
import { NgModule } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';

/** Third party imports */
import { MatDialogModule } from '@angular/material/dialog';
import { DragulaModule } from 'ng2-dragula';
import { DxTooltipModule } from 'devextreme-angular/ui/tooltip';
import { DxRadioGroupModule } from 'devextreme-angular/ui/radio-group';
import { DxPopupModule } from 'devextreme-angular/ui/popup';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { DxSelectBoxModule } from 'devextreme-angular/ui/select-box';
import { DxScrollViewModule } from 'devextreme-angular/ui/scroll-view';

/** Application imports */
import { BankCodeDecodeComponent } from './bank-code-decode/bank-code-decode.component';
import { BankCodeLetterComponent } from './bank-code-letter/bank-code-letter.component';
import { BankCodeAssessmentComponent } from './bank-code-assessment/bank-code-assessment.component';
import { BankCodeLettersComponent } from './bank-code-letters.component';
import { BankCodeService } from '@app/shared/common/bank-code/bank-code.service';
import { BankCodeLettersEditorDialogComponent } from './bank-code-letters-editor-dialog/bank-code-letters-editor-dialog.component';
import { BankCodeHistoryDialogComponent } from './bank-code-history-dialog/bank-code-history-dialog.component';
import { ModalDialogModule } from '@shared/common/dialogs/modal/modal-dialog.module';
import { DynamicMatDialogModule } from '@shared/common/dialogs/dynamic-overlay/dynamic-overlay.module';

@NgModule({
    imports: [
        CommonModule,
        DxTooltipModule,
        DxPopupModule,
        DxRadioGroupModule,
        DxSelectBoxModule,
        DxScrollViewModule,
        MatDialogModule,
        DragulaModule,
        DragDropModule,
        ModalDialogModule,
        DynamicMatDialogModule
    ],
    declarations: [
        BankCodeDecodeComponent,
        BankCodeLettersComponent,
        BankCodeAssessmentComponent,
        BankCodeLetterComponent,
        BankCodeLettersEditorDialogComponent,
        BankCodeHistoryDialogComponent
    ],
    exports: [
        BankCodeDecodeComponent,
        BankCodeLetterComponent,
        BankCodeLettersComponent
    ],
    providers: [
        BankCodeService,
        DecimalPipe
    ],
    entryComponents: [
        BankCodeLettersEditorDialogComponent,
        BankCodeHistoryDialogComponent
    ]
})
export class BankCodeLettersModule {}