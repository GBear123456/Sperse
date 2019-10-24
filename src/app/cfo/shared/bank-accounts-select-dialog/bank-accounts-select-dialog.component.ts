/** Core imports */
import { Component, Output, OnInit, EventEmitter, ViewChild, Inject } from '@angular/core';

/** Third party imports */
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';

/** Application imports */
import { BankAccountsServiceProxy, BusinessEntityServiceProxy } from 'shared/service-proxies/service-proxies';
import { BankAccountsService } from '@shared/cfo/bank-accounts/helpers/bank-accounts.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { IDialogButton } from '@shared/common/dialogs/modal/dialog-button.interface';
import { ModalDialogComponent } from '@shared/common/dialogs/modal/modal-dialog.component';
import { CFOService } from '@shared/cfo/cfo.service';
import { IBankAccountsSelectDialogData } from '@app/cfo/shared/bank-accounts-select-dialog/bank-accounts-select-dialog-data';

@Component({
    templateUrl: './bank-accounts-select-dialog.component.html',
    styleUrls: ['./bank-accounts-select-dialog.component.less'],
    providers: [ BankAccountsServiceProxy, BusinessEntityServiceProxy ]
})
export class BankAccountsSelectDialogComponent implements OnInit {
    @ViewChild(ModalDialogComponent) modalDialog: ModalDialogComponent;
    @Output() onApply: EventEmitter<any> = new EventEmitter();
    tooltipVisible: boolean;
    businessEntities = [];
    isActive = true;
    buttons: IDialogButton[];
    constructor(
        private cfoService: CFOService,
        private bankAccountsService: BankAccountsService,
        private dialogRef: MatDialogRef<BankAccountsSelectDialogComponent>,
        public ls: AppLocalizationService,
        @Inject(MAT_DIALOG_DATA) public data: IBankAccountsSelectDialogData
    ) {}

    ngOnInit() {
        this.buttons = [
            {
                title: this.ls.l('Cancel'),
                class: 'default',
                action: () => this.modalDialog.close(true, true)
            },
            {
                id: 'saveCompany',
                title: this.ls.l('Apply'),
                class: 'primary saveButton',
                action: this.apply.bind(this),
                disabled: this.data && this.data.applyDisabled
            }
        ];
        this.dialogRef.afterOpen().subscribe(() => {
            this.bankAccountsService.clearTempState();
        });
        this.dialogRef.afterClosed().subscribe((isApply: boolean) => {
            this.bankAccountsService.clearTempState();
            if (!isApply) {
                /** Reset state */
                this.bankAccountsService.resetState();
            }
        });
    }

    apply() {
        this.bankAccountsService.applyFilter(this.data && this.data.applyForLink);
        this.onApply.emit();
        this.modalDialog.close(true);
    }
}
