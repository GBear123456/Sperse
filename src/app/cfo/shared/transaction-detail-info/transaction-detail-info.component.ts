import { Component, Injector, Input, OnInit } from '@angular/core';
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import { InstanceType, TransactionDetailsDto, TransactionsServiceProxy } from '@shared/service-proxies/service-proxies';

@Component({
    selector: 'app-transaction-detail-info',
    templateUrl: './transaction-detail-info.component.html',
    styleUrls: ['./transaction-detail-info.component.less'],
    providers: [TransactionsServiceProxy]
})
export class TransactionDetailInfoComponent extends CFOComponentBase implements OnInit {
    @Input() transactionId: any;
    @Input() targetDetailInfoTooltip = '';
    isVisible = false;
    transactionInfo = new TransactionDetailsDto();
    transactionAttributeTypes: any;

    constructor(
        injector: Injector,
        private _transactionsService: TransactionsServiceProxy,
    ) {
        super(injector);
    }

    toggleTransactionDetailsInfo() {
        setTimeout(() => {
            this.getTransactionDetails();
            this.isVisible = !this.isVisible;
        }, 0);
    }

    ngOnInit() {
        this.getTransactionAttributeTypes();
    }

    closeTooltip() {
        this.isVisible = false;
    }

    getTransactionDetails() {
        this._transactionsService.getTransactionDetails(InstanceType[this.instanceType], this.instanceId, this.transactionId)
            .subscribe(result => {
                this.transactionInfo = result.transactionDetails;
            });
    }

    getTransactionAttributeTypes() {
        this._transactionsService.getTransactionAttributeTypes(InstanceType[this.instanceType], this.instanceId)
            .subscribe(result => {
                this.transactionAttributeTypes = result.transactionAttributeTypes;
            });
    }
}
