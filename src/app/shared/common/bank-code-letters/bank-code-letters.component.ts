import { Component, HostBinding, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { BankCodeLettersEditorDialogComponent } from '@app/shared/common/bank-code-letters/bank-code-letters-editor-dialog/bank-code-letters-editor-dialog.component';
import { DialogService } from '@app/shared/common/dialogs/dialog.service';

@Component({
    selector: 'bank-code-letters',
    templateUrl: './bank-code-letters.component.html',
    styleUrls: ['./bank-code-letters.component.less'],
    providers: [ DialogService ]
})
export class BankCodeLettersComponent {
    @Input() bankCode: string;
    @Input() showDescriptionsOnHover = false;
    @Input() personId: number;
    @HostBinding('class.allow-edit') @Input() allowEdit = false;

    constructor(
        private dialog: MatDialog,
        private dialogService: DialogService
    ) {}

    showEditPopup(e) {
        if (!this.dialog.getDialogById('bankCodeLettersEditorDialog')) {
            const editDialog = this.dialog.open(BankCodeLettersEditorDialogComponent, {
                id: 'bankCodeLettersEditorDialog',
                hasBackdrop: false,
                position: this.dialogService.calculateDialogPosition(e, e.target.closest('div'), 200, -12),
                data: {
                    bankCode: this.bankCode,
                    personId: this.personId
                }
            });
            editDialog.componentInstance.bankCodeChange.subscribe((bankCode: string) => {
                this.bankCode = bankCode;
            });
            e.stopPropagation();
            e.preventDefault();
        }
    }
}
