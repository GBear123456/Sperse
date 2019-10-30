/** Core imports */
import { Component, HostBinding, Input, OnChanges, SimpleChanges } from '@angular/core';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';

/** Application imports */
import { BankCodeLettersEditorDialogComponent } from '@app/shared/common/bank-code-letters/bank-code-letters-editor-dialog/bank-code-letters-editor-dialog.component';
import { DialogService } from '@app/shared/common/dialogs/dialog.service';
import { BankCodeLetter } from '@app/shared/common/bank-code-letters/bank-code-letter.enum';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { BankCodeService } from '@app/shared/common/bank-code/bank-code.service';

@Component({
    selector: 'bank-code-letters',
    templateUrl: './bank-code-letters.component.html',
    styleUrls: ['./bank-code-letters.component.less'],
    providers: [ DialogService ]
})
export class BankCodeLettersComponent implements OnChanges {
    @Input() bankCode: string;
    @Input() showDescriptionsOnHover = false;
    @Input() personId: number;
    @Input() key: string;
    @Input() showBankCodeDefinition = false;
    @Input() showReportLink = false;
    @Input() reportLinkType: 'Sales' | 'Profile';
    @Input() reportIconName: string;
    @HostBinding('class.allow-edit') @Input() allowEdit = false;
    bankCodeDefinition: string;

    constructor(
        private dialog: MatDialog,
        private dialogService: DialogService,
        private ls: AppLocalizationService,
        public bankCodeService: BankCodeService
    ) {}

    ngOnChanges(change: SimpleChanges) {
        if (change.bankCode && (this.showBankCodeDefinition || this.showReportLink)) {
            this.bankCodeDefinition = this.getBankCodeDefinition(change.bankCode.currentValue[0]);
        }
    }

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

    private getBankCodeDefinition(bankCodeLetter: BankCodeLetter): string {
        let definition: string;
        switch (bankCodeLetter) {
            case BankCodeLetter.B: definition = this.ls.l('BankCode_Blueprint'); break;
            case BankCodeLetter.A: definition = this.ls.l('BankCode_Action'); break;
            case BankCodeLetter.N: definition = this.ls.l('BankCode_Nurturing'); break;
            case BankCodeLetter.K: definition = this.ls.l('BankCode_Knowledge'); break;
        }
        return definition;
    }

    get reportIconSrc() {
        return this.reportIconName || this.bankCode[0];
    }
}
