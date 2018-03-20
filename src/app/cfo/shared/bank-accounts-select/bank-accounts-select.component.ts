import { Component, OnInit, Injector, Input, ViewChild, Output, EventEmitter } from '@angular/core';
import { CFOComponentBase } from 'app/cfo/shared/common/cfo-component-base';
import { BankAccountsServiceProxy, InstanceType, SyncAccountBankDto, BusinessEntityServiceProxy } from 'shared/service-proxies/service-proxies';

import { DxDataGridComponent } from 'devextreme-angular';
import { CacheService } from 'ng2-cache-service';
import * as _ from 'underscore';

@Component({
    selector: 'bank-accounts-select',
    templateUrl: './bank-accounts-select.component.html',
    styleUrls: ['./bank-accounts-select.component.less'],
    providers: [BankAccountsServiceProxy, BusinessEntityServiceProxy, CacheService]
})
export class BankAccountsSelectComponent extends CFOComponentBase implements OnInit {
    private initSelectedBankAccountsTimeout: any;
    @ViewChild(DxDataGridComponent) mainDataGrid: DxDataGridComponent;
    @Input() targetBankAccountsTooltip = '';
    @Input() useGlobalCache = false;
    @Output() onBankAccountsSelected: EventEmitter<any> = new EventEmitter();

    private readonly LOCAL_STORAGE = 0;

    data: SyncAccountBankDto[] = [];
    tooltipVisible: boolean;
    bankAccountsCacheKey = `Dashboard_BankAccounts_${abp.session.tenantId}_${abp.session.userId}`;
    allSelected: boolean = false;
    moreThanOneBusinessEntityExist: boolean = true;
    selectedBusinessEntities: any[];
    businessEntities = [];
    isActive: boolean = true;
    isActiveLabel: string;

    constructor(
        injector: Injector,
        private _bankAccountsService: BankAccountsServiceProxy,
        private _businessEntityService: BusinessEntityServiceProxy,
        private _cacheService: CacheService
    ) {
        super(injector);

        this._cacheService = this._cacheService.useStorage(this.LOCAL_STORAGE);
    }

    ngOnInit(): void {
        super.ngOnInit();
        let initIsActive = true;
        if (this.useGlobalCache && this._cacheService.exists(this.bankAccountsCacheKey)) {
            var cacheData = this._cacheService.get(this.bankAccountsCacheKey);
            initIsActive = cacheData['isActive'] ? true : false;
        }
        this.setIsActive(initIsActive);

        this.getBankAccounts();
        this.getBusinessEntities();
    }

    isActiveChanged(e) {
        this.setIsActive(e.value);
        this.getBankAccounts();
    }

    setIsActive(val) {
        this.isActiveLabel = val ? this.l('Active') : this.l('Disabled');
        this.isActive = val;
    }

    getBusinessEntities() {
        this._businessEntityService.getBusinessEntities(InstanceType[this.instanceType], this.instanceId)
            .subscribe((result) => {
                this.businessEntities = result;
                this.moreThanOneBusinessEntityExist = result.length > 1;
            });
    }

    businessEntitySelectedChange(e) {
        this.selectedBusinessEntities = e.component._selectedItems;
        this.getBankAccounts();
    }

    masterRowExpandChange(e) {
        if (e.columnIndex !== 0 && e.row) {
            if (e.row.isExpanded) {
                e.component.collapseRow(e.key);
            } else {
                e.component.expandRow(e.key);
            }
        }
    }

    masterSelectionChanged(e) {
        let row = e.component.getVisibleRows()[e.component.getRowIndexByKey(e.key)];
        let isSelected = e.data.selected;
        row.data.bankAccounts.forEach((bankAccount, i) => {
            bankAccount['selected'] = isSelected;
        });
    }

    bankAccountSelectionChanged(e) {
        this.mainDataGrid.instance.getVisibleRows().forEach((row, i) => {
            if (row.rowType !== 'detail') {
                let selectedBankAccountCount = 0;
                row.data['bankAccounts'].forEach((bankAccount, i) => {
                    if (bankAccount['selected'])
                        selectedBankAccountCount++;
                });

                if (selectedBankAccountCount === 0) {
                    row.data['selected'] = false;
                } else {
                    if (selectedBankAccountCount === row.data['bankAccounts'].length) {
                        row.data['selected'] = true;
                    } else {
                        row.data['selected'] = undefined;
                    }
                }
                this.mainDataGrid.instance.repaintRows([i]);
            }
        });        
    }

    bankAccountsSelecteAll() {
        let newData = [];

        this.data.forEach((syncAccount, i) => {
            let bankAccounts = [];
            syncAccount.bankAccounts.forEach((bankAccount, i) => {
                bankAccount['selected'] = true;
                bankAccounts.push(bankAccount);
            });
            syncAccount.bankAccounts = bankAccounts;
            syncAccount['selected'] = true;
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
            let selectedBankAccountCount = 0;
            syncAccount.bankAccounts.forEach((bankAccount, i) => {
                let isBankAccountSelected = _.contains(bankAccountsIds, bankAccount.id.toString());
                bankAccount['selected'] = isBankAccountSelected;
                bankAccounts.push(bankAccount);
                if (isBankAccountSelected)
                    selectedBankAccountCount++;
            });
            syncAccount.bankAccounts = bankAccounts;
            if (selectedBankAccountCount === 0) {
                syncAccount['selected'] = false;
            } else {
                if (selectedBankAccountCount === bankAccounts.length) {
                    syncAccount['selected'] = true;
                } else {
                    syncAccount['selected'] = undefined;
                }
            }
            newData.push(syncAccount);
        });
        this.data = newData;
        if (this.mainDataGrid)
            this.mainDataGrid.instance.refresh();
    }

    bankAccountsClear() {
        this.refreshSelected([]);

        if (this.useGlobalCache)
            this._cacheService.set(this.bankAccountsCacheKey, {});

        this.onBankAccountsSelected.emit({
            bankAccountIds: [],
            banksWithAccounts: []
        });
        this.tooltipVisible = false;
    }

    bankAccountsSelected() {
        let result = [];
        let resultWithBanks = [];

        this.mainDataGrid.instance.getVisibleRows().forEach((row, i) => {
            if (row.rowType !== 'detail') {
                row.data['bankAccounts'].forEach((bankAccount, i) => {
                    if (bankAccount['selected']) {
                        result.push(bankAccount.id);
                        resultWithBanks.push(row.data['bankId'] + ':' + bankAccount.id);
                    }
                });
            }
        });
        
        let data = {
            bankAccountIds: result,
            banksWithAccounts: resultWithBanks
        };
        if (this.useGlobalCache)
            this._cacheService.set(this.bankAccountsCacheKey, { 'bankAccounts': data.banksWithAccounts, 'isActive': this.isActive });

        this.onBankAccountsSelected.emit(data);
        this.tooltipVisible = false;
    }

    toggleBankAccountTooltip() {
        this.tooltipVisible = !this.tooltipVisible;
    }

    getBankAccounts(): void {
        let businessEntityIds = _.map(this.selectedBusinessEntities, function (b) { return b.id; });
        this._bankAccountsService.getBankAccounts(InstanceType[this.instanceType], this.instanceId, 'USD', businessEntityIds, this.isActive)
            .subscribe((result) => {
                this.data = result;
                
                if (this.useGlobalCache && this._cacheService.exists(this.bankAccountsCacheKey)) {                    
                    let resultWithBanks = this._cacheService.get(this.bankAccountsCacheKey)['bankAccounts'];
                    let bankAccountIds = this.removeBankIds(resultWithBanks);
                    this.refreshSelected(bankAccountIds);

                    let data = {
                        bankAccountIds: bankAccountIds,
                        banksWithAccounts: resultWithBanks
                    };

                    this.onBankAccountsSelected.emit(data);
                }
                else {
                    this.refreshSelected([]);
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
