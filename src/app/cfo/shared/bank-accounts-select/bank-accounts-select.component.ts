import { Component, OnInit, Injector, Input, ViewChild, Output, EventEmitter } from '@angular/core';
import { CFOComponentBase } from 'app/cfo/shared/common/cfo-component-base';
import { BankAccountsServiceProxy, InstanceType, BankDto } from 'shared/service-proxies/service-proxies';

import { DxDropDownBoxComponent } from 'devextreme-angular';
import { CacheService } from 'ng2-cache-service';

@Component({
    selector: 'bank-accounts-select',
    templateUrl: './bank-accounts-select.component.html',
    styleUrls: ['./bank-accounts-select.component.less'],
    providers: [BankAccountsServiceProxy, CacheService]
})
export class BankAccountsSelectComponent extends CFOComponentBase implements OnInit {
    @Input() targetBankAccountsTooltip = "";

    @Output() onBankAccountsSelected: EventEmitter<any> = new EventEmitter();

    data: any;
    tooltipVisible: boolean;
    selectedRowKeys: any[] = [];
    bankAccountsCacheKey = `Dashboard_BankAccounts_${abp.session.tenantId}_${abp.session.userId}`;

    constructor(
        injector: Injector,
        private _bankAccountsService: BankAccountsServiceProxy,
        private _cacheService: CacheService
    ) {
        super(injector);
    }

    ngOnInit(): void {
        super.ngOnInit();
        this.getBankAccounts();
    }

    bankAccountsClear() {
        this.selectedRowKeys = [];
        this.onBankAccountsSelected.emit({
            bankAccountIds: [],
            banksWithAccounts: []
        });
        this.tooltipVisible = false;
    }

    bankAccountsSelected() {
        let result = [];
        this.selectedRowKeys.forEach((key, i) => {
            result.push(key.substring(key.search(':') + 1));
        });

        let data = {
            bankAccountIds: result,
            banksWithAccounts: this.selectedRowKeys.slice()
        };
        this._cacheService.set(this.bankAccountsCacheKey, data.banksWithAccounts);

        this.onBankAccountsSelected.emit(data);
        this.tooltipVisible = false;
    }

    toggleBankAccountTooltip() {
        this.tooltipVisible = !this.tooltipVisible;
    }

    getBankAccounts(): void {
        this._bankAccountsService.getBankAccounts(InstanceType[this.instanceType], this.instanceId)
            .subscribe((result) => {
                this.data = this.convertBanksToTreeSource(result);

                if (this._cacheService.exists(this.bankAccountsCacheKey)) {
                    this.selectedRowKeys = this._cacheService.get(this.bankAccountsCacheKey);
                    this.bankAccountsSelected();
                }
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
