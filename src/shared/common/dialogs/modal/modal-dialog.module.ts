/** Core imports */
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

/** Third party imports */
import { MatDialogModule } from '@angular/material/dialog';
import { DxTextBoxModule } from 'devextreme-angular/ui/text-box';
import { DxCheckBoxModule } from 'devextreme-angular/ui/check-box';

/** Application imports */
import { ModalDialogComponent } from './modal-dialog.component';

@NgModule({
    imports: [
        CommonModule,
        MatDialogModule,
        DxTextBoxModule,
        DxCheckBoxModule
    ],
    exports: [ ModalDialogComponent ],
    declarations: [ ModalDialogComponent ],
    providers: [],
    entryComponents: [ ModalDialogComponent ]
})
export class ModalDialogModule {}