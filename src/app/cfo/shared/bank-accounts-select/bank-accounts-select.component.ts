import { Component, OnInit, Injector, Input, ViewChild, Output, EventEmitter } from '@angular/core';
import { CFOComponentBase } from 'app/cfo/shared/common/cfo-component-base';
import { BankAccountsServiceProxy, InstanceType, SyncAccountBankDto } from 'shared/service-proxies/service-proxies';

import { DxDataGridComponent } from 'devextreme-angular';
import { CacheService } from 'ng2-cache-service';
import * as _ from 'underscore';

@Component({
    selector: 'bank-accounts-select',
    templateUrl: './bank-accounts-select.component.html',
    styleUrls: ['./bank-accounts-select.component.less'],
    providers: [BankAccountsServiceProxy, CacheService]
})
export class BankAccountsSelectComponent extends CFOComponentBase implements OnInit {
    private initSelectedBankAccountsTimeout: any;
    @ViewChild(DxDataGridComponent) mainDataGrid: DxDataGridComponent;
    @Input() targetBankAccountsTooltip = '';
    @Input() useGlobalCache = false;
    @Output() onBankAccountsSelected: EventEmitter<any> = new EventEmitter();

    private readonly LOCAL_STORAGE = 0;

    data: SyncAccountBankDto[] = [];
    selectedBankAccountIds = {};
    tooltipVisible: boolean;
    bankAccountsCacheKey = `Dashboard_BankAccounts_${abp.session.tenantId}_${abp.session.userId}`;
    allSelected: boolean = false;

    constructor(
        injector: Injector,
        private _bankAccountsService: BankAccountsServiceProxy,
        private _cacheService: CacheService
    ) {
        super(injector);

        this._cacheService = this._cacheService.useStorage(this.LOCAL_STORAGE);
    }

    ngOnInit(): void {
        super.ngOnInit();
        this.getBankAccounts();
    }

    contentReady(e) {
        if (!e.component.getSelectedRowKeys().length)
            e.component.selectRowsByIndexes(0);
    }

    masterSelectionChanged(e) {
        e.component.collapseAll(-1);
        e.component.expandRow(e.currentSelectedRowKeys[0]);
    }

    bankAccountSelectionChanged(e) {
        e.component.getVisibleRows().forEach((row, i) => {
            row.data['selected'] = row.isSelected;
            this.selectedBankAccountIds[row.data.id] = row.isSelected;
        });
    }

    bankAccountsSelecteAll() {
        let newData = [];

        this.data.forEach((syncAccount, i) => {
            let bankAccounts = [];
            syncAccount.bankAccounts.forEach((bankAccount, i) => {
                bankAccount['selected'] = true;
                this.selectedBankAccountIds[bankAccount.id] = bankAccount['selected'];
                bankAccounts.push(bankAccount);
            });
            syncAccount.bankAccounts = bankAccounts;
            newData.push(syncAccount);
        });
        this.data = newData;
        if (this.mainDataGrid)
            this.mainDataGrid.instance.refresh();
    }

    refreshSelected(bankAccountsIds: any[]) {
        let newData = [];
        this.data.forEach((syncAccount, i) => {

            let bankAccounts = [];
            syncAccount.bankAccounts.forEach((bankAccount, i) => {
                bankAccount['selected'] = _.contains(bankAccountsIds, bankAccount.id.toString());
                this.selectedBankAccountIds[bankAccount.id] = bankAccount['selected'];
                bankAccounts.push(bankAccount);
            });
            syncAccount.bankAccounts = bankAccounts;
            newData.push(syncAccount);
        });
        this.data = newData;
        if (this.mainDataGrid)
            this.mainDataGrid.instance.refresh();
    }

    bankAccountsClear() {
        this.refreshSelected([]);

        if (this.useGlobalCache)
            this._cacheService.set(this.bankAccountsCacheKey, []);

        this.onBankAccountsSelected.emit({
            bankAccountIds: [],
            banksWithAccounts: []
        });
        this.tooltipVisible = false;
    }

    bankAccountsSelected() {
        let result = [];
        let resultWithBanks = [];

        this.data.forEach((syncAccount, i) => {
            syncAccount.bankAccounts.forEach((bankAccount, i) => {
                if (this.selectedBankAccountIds[bankAccount.id] === true) {
                    result.push(bankAccount.id);
                    resultWithBanks.push(syncAccount.bankId + ':' + bankAccount.id);
                }
            });
        });

        let data = {
            bankAccountIds: result,
            banksWithAccounts: resultWithBanks
        };
        if (this.useGlobalCache)
            this._cacheService.set(this.bankAccountsCacheKey, data.banksWithAccounts);

        this.onBankAccountsSelected.emit(data);
        this.tooltipVisible = false;
    }

    toggleBankAccountTooltip() {
        this.tooltipVisible = !this.tooltipVisible;
    }

    getBankAccounts(): void {
        this._bankAccountsService.getBankAccounts(InstanceType[this.instanceType], this.instanceId, 'USD', [])
            .subscribe((result) => {
                this.data = result;

                if (this.useGlobalCache && this._cacheService.exists(this.bankAccountsCacheKey)) {
                    let bankAccountIds = this.removeBankIds(this._cacheService.get(this.bankAccountsCacheKey));
                    this.refreshSelected(bankAccountIds);
                    this.bankAccountsSelected();
                }
            });
    }

    getItems() {
        return this.data;
    }

    calculateChartsScrolableHeight() {
        let contentHeight = $('dx-data-grid').height();
        if (contentHeight < 230) {
            return 200;
        } else if (contentHeight < 300) {
            return 230;
        } else if (contentHeight < 400) {
            return 330;
        } else if (contentHeight < 500) {
            return 430;
        } else {
            return 480;
        }
    }

    setSelectedBankAccounts(bankAccountIds) {
        bankAccountIds = this.removeBankIds(bankAccountIds);
        this.refreshSelected(bankAccountIds);
    }

    removeBankIds(banksWithAccountIds) {
        return _.map(banksWithAccountIds,
            (id) => {
                let position = id.search(':');
                if (position !== -1)
                    return id.substring(position + 1);

            });
    }
}
