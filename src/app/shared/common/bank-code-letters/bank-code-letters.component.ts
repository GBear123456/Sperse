/** Core imports */
import { Component, HostBinding, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';

/** Application imports */
import { BankCodeLettersEditorDialogComponent } from '@app/shared/common/bank-code-letters/bank-code-letters-editor-dialog/bank-code-letters-editor-dialog.component';
import { DialogService } from '@app/shared/common/dialogs/dialog.service';
import { BankCodeService } from '@app/shared/common/bank-code/bank-code.service';

@Component({
    selector: 'bank-code-letters',
    templateUrl: './bank-code-letters.component.html',
    styleUrls: ['./bank-code-letters.component.less'],
    providers: [ DialogService ]
})
export class BankCodeLettersComponent implements OnChanges, OnDestroy {
    @Input() bankCode: string;
    @Input() showDescriptionsOnHover = false;
    @Input() personId: number;
    @Input() key = '';
    @Input() showBankCodeDefinition = false;
    @Input() showReportLink = false;
    @Input() reportLinkType: 'Sales' | 'Profile';
    @Input() reportIconName: string;
    @HostBinding('class.allow-add') @Input() allowAdd = false;
    @HostBinding('class.allow-edit') @Input() allowEdit = false;
    bankCodeDefinition: string;
    readonly emptyBankCode = '????';

    constructor(
        private dialogService: DialogService,
        public dialog: MatDialog,
        public bankCodeService: BankCodeService
    ) {}

    ngOnChanges(change: SimpleChanges) {
        if (change.bankCode && (this.showBankCodeDefinition || this.showReportLink)) {
            this.bankCodeDefinition = this.bankCodeService.getBankCodeDefinition(change.bankCode.currentValue[0]);
        }
        if (change.allowAdd && change.allowAdd.currentValue && !this.bankCode) {
            this.bankCode = this.emptyBankCode;
        }
    }

    showEditPopup(e, xPosition = 200) {
        if (!this.dialog.getDialogById('bankCodeLettersEditorDialog')) {
            const editDialog = this.dialog.open(BankCodeLettersEditorDialogComponent, {
                id: 'bankCodeLettersEditorDialog',
                hasBackdrop: false,
                position: this.dialogService.calculateDialogPosition(e, e.target.closest('div'), xPosition, -12),
                data: {
                    bankCode: this.bankCode === this.emptyBankCode ? 'BANK' : this.bankCode,
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

    get reportIconSrc() {
        return this.reportIconName || this.bankCode[0];
    }

    onLetterClick(e) {
        if (this.allowAdd && this.bankCode === this.emptyBankCode) {
            this.showEditPopup(e, 350);
        }
    }

    closeDialog() {
        const dialog = this.dialog.getDialogById('bankCodeLettersEditorDialog');
        if (dialog) {
            dialog.close();
        }
    }

    ngOnDestroy(): void {
        this.closeDialog();
    }
}
