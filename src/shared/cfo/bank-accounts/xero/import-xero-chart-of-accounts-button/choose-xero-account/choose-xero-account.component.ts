import { Component, Inject, Injector, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import { SyncAccountDto } from 'shared/service-proxies/service-proxies';

@Component({
    selector: 'app-choose-xero-account',
    templateUrl: './choose-xero-account.component.html',
    styleUrls: ['./choose-xero-account.component.less']
})
export class ChooseXeroAccountComponent extends CFOComponentBase implements OnInit {
    accounts: SyncAccountDto[] = null;
    selectedAccountId: number = null;
    createAccountAvailable: boolean = false;

    constructor(
        injector: Injector,
        public dialogRef: MatDialogRef<ChooseXeroAccountComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        super(injector);
    }

    ngOnInit(): void {
        super.ngOnInit();
        this.createAccountAvailable = this.data.createAccountAvailable;
        this.accounts = this.data.accounts;
        this.selectedAccountId = this.accounts[0].id;
    }

    onSave() {
        this.dialogRef.close(this.selectedAccountId);
    }

    onConnectNew() {
        this.dialogRef.close(-1);
    }

    onCancel() {
        this.dialogRef.close(null);
    }
}
