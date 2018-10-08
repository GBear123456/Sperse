import { Component, OnInit, Injector, ChangeDetectionStrategy, Input } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { BankTransferDataModel } from '@app/shared/common/payment-wizard/models/bank-transfer-data.model';
import { MatDialog } from '@angular/material';
import { ConditionsModalComponent } from '@shared/common/conditions-modal/conditions-modal.component';
import { ConditionsType } from '@shared/AppEnums';

@Component({
    selector: 'bank-transfer',
    templateUrl: './bank-transfer.component.html',
    styleUrls: ['./bank-transfer.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class BankTransferComponent extends AppComponentBase implements OnInit {
    @Input() titleText = this.l('BankTransferTitleText');
    bankTransferData = <BankTransferDataModel>{
        bankAccountNumber: 457031074865,
        bankRoutingNumberForACHTransfers: 122101706,
        bankRoutingNumber: '026009593',
        SWIFT_CodeForUSDollar: 'BOFAUS3N',
        SWIFT_Code: 'BOFAUS6S'
    };

    constructor(
        injector: Injector,
        private dialog: MatDialog
    ) {
        super(injector);
    }

    ngOnInit() {}

    openTermsModal() {
        this.dialog.open(ConditionsModalComponent, { panelClass: 'slider', data: { type: ConditionsType.Terms } });
    }

}
