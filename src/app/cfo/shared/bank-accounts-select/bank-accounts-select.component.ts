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

    syncAccountsDataSource: SyncAccountBankDto[] = [];
    tooltipVisible: boolean;
    bankAccountsCacheKey = `Dashboard_BankAccounts_${abp.session.tenantId}_${abp.session.userId}`;
    allSelected: boolean = false;
    moreThanOneBusinessEntityExist: boolean = true;
    selectedBusinessEntities: any[];
    businessEntities = [];
    isActive: boolean = true;
    isActiveLabel: string;
    baseBankAccountTypes = ['Checking', 'Savings', 'Credit Card'];
    allAccountTypesFilter: string;
    bankAccountTypesForSelect = [];
    existBankAccountTypes = [];
    selectedBankAccountType: string = null;

    constructor(
        injector: Injector,
        private _bankAccountsService: BankAccountsServiceProxy,
        private _businessEntityService: BusinessEntityServiceProxy,
        private _cacheService: CacheService
    ) {
        super(injector);

        this._cacheService = this._cacheService.useStorage(this.LOCAL_STORAGE);
        this.allAccountTypesFilter = this.l('All Accounts');
        this.selectedBankAccountType = this.allAccountTypesFilter;
    }

    ngOnInit(): void {
        super.ngOnInit();
        let initIsActive = true;
        if (this.useGlobalCache && this._cacheService.exists(this.bankAccountsCacheKey)) {
            var cacheData = this._cacheService.get(this.bankAccountsCacheKey);
            initIsActive = cacheData['isActive'] ? true : false;
        }
        this.setIsActive(initIsActive);

        this.getBankAccounts(true);
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
        this.syncAccountsDataSource.forEach((syncAccount, i) => {
            let selectedBankAccountCount = 0;
            syncAccount.bankAccounts.forEach((bankAccount, i) => {
                if (bankAccount['selected'])
                    selectedBankAccountCount++;
            });

            if (selectedBankAccountCount === 0) {
                syncAccount['selected'] = false;
            } else {
                if (selectedBankAccountCount === syncAccount.bankAccounts.length) {
                    syncAccount['selected'] = true;
                } else {
                    syncAccount['selected'] = null;
                }
            }
            this.mainDataGrid.instance.repaintRows([this.mainDataGrid.instance.getRowIndexByKey(syncAccount.syncAccountId)]);
        });
    }

    bankAccountsSelecteAll() {
        this.syncAccountsDataSource.forEach((syncAccount, i) => {
            syncAccount.bankAccounts.forEach((bankAccount, i) => {
                bankAccount['selected'] = true;
            });
            syncAccount['selected'] = true;
        });

        if (this.mainDataGrid)
            this.mainDataGrid.instance.refresh();
    }

    refreshSelected(bankAccountsIds: any[]) {
        this.syncAccountsDataSource.forEach((syncAccount, i) => {
            let selectedBankAccountCount = 0;
            syncAccount.bankAccounts.forEach((bankAccount, i) => {
                let isBankAccountSelected = _.contains(bankAccountsIds, bankAccount.id.toString());
                bankAccount['selected'] = isBankAccountSelected;
                if (isBankAccountSelected)
                    selectedBankAccountCount++;
            });
            if (selectedBankAccountCount === 0) {
                syncAccount['selected'] = false;
            } else {
                if (selectedBankAccountCount === syncAccount.bankAccounts.length) {
                    syncAccount['selected'] = true;
                } else {
                    syncAccount['selected'] = undefined;
                }
            }
        });
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

        this.syncAccountsDataSource.forEach((syncAccaunt, i) => {
            syncAccaunt.bankAccounts.forEach((bankAccount, i) => {
                if (bankAccount['selected']) {
                    result.push(bankAccount.id);
                    resultWithBanks.push(syncAccaunt.bankId + ':' + bankAccount.id);
                }
            });
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

    getBankAccounts(initial = false): void {
        let businessEntityIds = _.map(this.selectedBusinessEntities, function (b) { return b.id; });
        this._bankAccountsService.getBankAccounts(InstanceType[this.instanceType], this.instanceId, 'USD', businessEntityIds, this.isActive)
            .subscribe((result) => {
                this.syncAccountsDataSource = result;

                this.getExistBankAccountTypes();
                this.filterByBankAccountType();

                if (this.useGlobalCache && this._cacheService.exists(this.bankAccountsCacheKey)) {
                    let resultWithBanks = this._cacheService.get(this.bankAccountsCacheKey)['bankAccounts'];
                    let bankAccountIds = this.removeBankIds(resultWithBanks);
                    this.refreshSelected(bankAccountIds);

                    if (initial) {
                        let data = {
                            bankAccountIds: bankAccountIds,
                            banksWithAccounts: resultWithBanks
                        };

                        this.onBankAccountsSelected.emit(data);
                    }
                } else {
                    this.refreshSelected([]);
                }
            });
    }

    getExistBankAccountTypes() {
        this.existBankAccountTypes = [];
        this.syncAccountsDataSource.forEach((syncAccount, i) => {
            let types = _.uniq(_.map(syncAccount.bankAccounts, function (bankAccount) { return bankAccount.type; }));
            this.existBankAccountTypes = _.union(this.existBankAccountTypes, types);
        });
        this.bankAccountTypesForSelect = [];
        this.bankAccountTypesForSelect.push(this.allAccountTypesFilter);
        this.baseBankAccountTypes.forEach((type, i) => {
            if (_.contains(this.existBankAccountTypes, type)) {
                this.bankAccountTypesForSelect.push(type);
            }
        });

        let otherExist = _.difference(this.existBankAccountTypes, this.baseBankAccountTypes).length ? true : false;
        if (otherExist)
            this.bankAccountTypesForSelect.push(this.l('Other'));
    }

    filterByBankAccountType() {
        if (this.selectedBankAccountType === this.allAccountTypesFilter) {
            this.syncAccountsDataSource.forEach((syncAccount, i) => {
                syncAccount.bankAccounts.forEach((bankAccount, i) => {
                    bankAccount['visible'] = true;
                });
                syncAccount['visible'] = true;
            });
        } else if (this.selectedBankAccountType === this.l('Other')) {
            this.syncAccountsDataSource.forEach((syncAccount, i) => {
                let visibleBankAccountsExist = false;
                syncAccount.bankAccounts.forEach((bankAccount, i) => {
                    let isBankAccountVisible = !_.contains(this.bankAccountTypesForSelect, bankAccount.type);
                    bankAccount['visible'] = isBankAccountVisible;
                    if (isBankAccountVisible)
                        visibleBankAccountsExist = true;;
                });
                syncAccount['visible'] = visibleBankAccountsExist;
            });
        } else {
            this.syncAccountsDataSource.forEach((syncAccount, i) => {
                let visibleBankAccountsExist = false;
                syncAccount.bankAccounts.forEach((bankAccount, i) => {
                    let isBankAccountVisible = this.selectedBankAccountType === bankAccount.type;
                    bankAccount['visible'] = isBankAccountVisible;
                    if (isBankAccountVisible)
                        visibleBankAccountsExist = true;;
                });
                syncAccount['visible'] = visibleBankAccountsExist;
            });
        }
    }

    bankAccountTypeChanged(e) {
        if (this.selectedBankAccountType !== e.itemData) {
            this.selectedBankAccountType = e.itemData;
            this.filterByBankAccountType();

            if (this.mainDataGrid)
                this.mainDataGrid.instance.refresh();
        }
    }

    getItems() {
        return this.syncAccountsDataSource;
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
