import { Component, Injector, ChangeDetectionStrategy, Input } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { BankTransferDataModel } from '@app/shared/common/payment-wizard/models/bank-transfer-data.model';

@Component({
    selector: 'bank-transfer',
    templateUrl: './bank-transfer.component.html',
    styleUrls: ['./bank-transfer.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class BankTransferComponent extends AppComponentBase {
    @Input() titleText = this.l('BankTransferTitleText');
    bankTransferData = <BankTransferDataModel>{
        bankAccountNumber: 457031074865,
        bankRoutingNumberForACHTransfers: 122101706,
        bankRoutingNumber: '026009593',
        SWIFT_CodeForUSDollar: 'BOFAUS3N',
        SWIFT_Code: 'BOFAUS6S'
    };

    constructor(
        injector: Injector
    ) {
        super(injector);
    }

}
