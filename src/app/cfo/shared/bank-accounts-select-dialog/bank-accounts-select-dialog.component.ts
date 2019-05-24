/** Core imports */
import { Component, ChangeDetectionStrategy, Input, Output, OnInit, EventEmitter, ViewChild, Inject } from '@angular/core';

/** Third party imports */
import { MAT_DIALOG_DATA } from '@angular/material';

/** Application imports */
import { BankAccountsServiceProxy, BusinessEntityServiceProxy, InstanceType } from 'shared/service-proxies/service-proxies';
import { BankAccountsService } from '@shared/cfo/bank-accounts/helpers/bank-accounts.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { IDialogButton } from '@shared/common/dialogs/modal/dialog-button.interface';
import { ModalDialogComponent } from '@shared/common/dialogs/modal/modal-dialog.component';
import { CFOService } from '@shared/cfo/cfo.service';
import { IBankAccountsSelectDialogData } from '@app/cfo/shared/bank-accounts-select-dialog/bank-accounts-select-dialog-data';
import { PermissionCheckerService } from '@abp/auth/permission-checker.service';

@Component({
    templateUrl: './bank-accounts-select-dialog.component.html',
    styleUrls: ['./bank-accounts-select-dialog.component.less'],
    providers: [ BankAccountsServiceProxy, BusinessEntityServiceProxy ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class BankAccountsSelectDialogComponent implements OnInit {
    @ViewChild(ModalDialogComponent) modalDialog: ModalDialogComponent;
    @Output() onApplySelected: EventEmitter<any> = new EventEmitter();
    tooltipVisible: boolean;
    selectedBusinessEntitiesIds: any[] = [];
    businessEntities = [];
    isActive = true;
    buttons: IDialogButton[];
    constructor(
        private cfoService: CFOService,
        private bankAccountsService: BankAccountsService,
        private permissionCheckerService: PermissionCheckerService,
        public ls: AppLocalizationService,
        @Inject(MAT_DIALOG_DATA) public data: IBankAccountsSelectDialogData
    ) {}

    ngOnInit() {
        this.buttons = [
            {
                title: this.ls.l('Cancel'),
                class: 'default',
                action: () => this.modalDialog.close(true)
            },
            {
                id: 'saveCompany',
                title: this.ls.l('Apply'),
                class: 'primary saveButton',
                disabled: !(this.cfoService.instanceType === InstanceType.Main && this.permissionCheckerService.isGranted('Pages.CFO.MainInstanceAccess'))
                          && !this.permissionCheckerService.isGranted('Pages.CFO.MemberAccess'),
                action: this.apply.bind(this)
            }
        ];
    }

    apply() {
        this.bankAccountsService.applyFilter();
        this.onApplySelected.emit();
        this.modalDialog.close(true);
    }

}
