import { Component, Inject, Injector, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import { SyncAccountDto } from 'shared/service-proxies/service-proxies';

@Component({
    selector: 'app-choose-account',
    templateUrl: './choose-account.component.html',
    styleUrls: ['./choose-account.component.less']
})
export class ChooseAccountComponent extends CFOComponentBase implements OnInit {
    accounts: SyncAccountDto[] = null;
    selectedAccountId: number = null;
    createAccountAvailable = false;

    constructor(
        injector: Injector,
        public dialogRef: MatDialogRef<ChooseAccountComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        super(injector);
    }

    ngOnInit(): void {
        this.dialogRef.updateSize('550px');
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