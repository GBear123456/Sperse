import { Component, OnInit, Injector, Output, EventEmitter } from '@angular/core';
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import { QuovoService, QuovoHandler } from '../quovo/QuovoService';
import { SyncAccountServiceProxy, InstanceType } from 'shared/service-proxies/service-proxies';
import { CFOService } from '@shared/cfo/cfo.service';
import { MatDialog } from '@angular/material';
import { AccountConnectorDialogComponent } from '@shared/common/account-connector-dialog/account-connector-dialog';

@Component({
    selector: 'add-account-button',
    templateUrl: './add-account-button.component.html',
    styleUrls: ['./add-account-button.component.less'],
    providers: [ SyncAccountServiceProxy ]
})
export class AddAccountButtonComponent extends CFOComponentBase implements OnInit {
    @Output() onClose: EventEmitter<any> = new EventEmitter();
    tooltipVisible = false;
    quovoHandler: QuovoHandler;
    createAccountAvailable: boolean;
    constructor(
        injector: Injector,
        private quovoService: QuovoService,
        private cfoService: CFOService,
        private _syncAccountServiceProxy: SyncAccountServiceProxy,
        private dialog: MatDialog
    ) {
        super(injector);
        this._syncAccountServiceProxy.isAvailableCreateAccount(InstanceType[this.instanceType], this.instanceId)
            .subscribe((result) => {
                this.createAccountAvailable = result;
            });
    }

    ngOnInit(): void {
        super.ngOnInit();
        if (!this.quovoHandler) {
            this.quovoHandler = this.quovoService.getQuovoHandler(this.cfoService.instanceType, this.cfoService.instanceId);
        }
    }

    openAddAccountDialog() {
        if (!this.createAccountAvailable)
            return;

        this.dialog.open(AccountConnectorDialogComponent, AccountConnectorDialogComponent.defaultConfig);
    }

}
