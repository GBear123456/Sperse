import { Component, OnInit, Injector, Input, ViewChild, Output, EventEmitter} from '@angular/core';
import { CFOComponentBase } from 'app/cfo/shared/common/cfo-component-base';
import { BankAccountsServiceProxy, InstanceType, BankDto } from 'shared/service-proxies/service-proxies';

import { DxDropDownBoxComponent } from 'devextreme-angular';

@Component({
    selector: 'bank-accounts-select',
    templateUrl: './bank-accounts-select.component.html',
    styleUrls: ['./bank-accounts-select.component.less'],
    providers: [BankAccountsServiceProxy]
})
export class BankAccountsSelectComponent extends CFOComponentBase implements OnInit {    
    @Input() targetBankAccountsTooltip = "";

    @Output() onBankAccountsSelected: EventEmitter<any> = new EventEmitter();

    data: any;
    tooltipVisible: boolean;
    selectedRowKeys: any[] = [];

    constructor(
        injector: Injector,
        private _bankAccountsService: BankAccountsServiceProxy
    ) {
        super(injector);
    }

    ngOnInit(): void {
        super.ngOnInit();
        this.getBankAccounts();
    }

    bankAccountsClear() {
        this.selectedRowKeys = [];
        this.onBankAccountsSelected.emit([]);
        this.tooltipVisible = false;
    }

    bankAccountsSelected() {
        let result = [];
        this.selectedRowKeys.forEach((key, i) => {
            result.push(key.substring(key.search(':')+1));
        });
        this.onBankAccountsSelected.emit(result);
        this.tooltipVisible = false;
    }

    toggleBankAccountTooltip() {
        this.tooltipVisible = !this.tooltipVisible;
    }

    getBankAccounts(): void {
        this._bankAccountsService.getBankAccounts(InstanceType[this.instanceType], this.instanceId)
            .subscribe((result) => {
                this.data = this.convertBanksToTreeSource(result);
            });
    }

    getItems() {
        return this.data;
    }

    convertBanksToTreeSource(data: BankDto[]): any[] {
        let result = [];
        data.forEach((bank, i) => {
            result.push({
                id: bank.id.toString(),
                parent: 0,
                name: bank.name
            });

            bank.bankAccounts.forEach((acc, j) => {
                result.push({
                    id: bank.id + ':' + acc.id,
                    parent: bank.name,
                    parentId: bank.id,
                    name: (acc.accountName ? acc.accountName : 'No name'),
                    number: acc.accountNumber
                });
            });
        });

        return result;
    }
    calculateChartsScrolableHeight() {
        let contentHeight = $('dx-tree-list').height();
        if (contentHeight < 230) {
            return 200;
        } else if (contentHeight < 300) {
            return 230;
        } else if (contentHeight < 400) {
            return 330;
        } else if (contentHeight < 500) {
            return 430;
        } else {
            return 550;
        }
    }
}
