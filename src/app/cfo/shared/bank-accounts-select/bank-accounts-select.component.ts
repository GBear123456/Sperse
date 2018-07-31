import { Component, OnInit, Injector, Input, ViewChild, Output, EventEmitter } from '@angular/core';
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import { BankAccountsServiceProxy, InstanceType, SyncAccountBankDto, BusinessEntityServiceProxy } from 'shared/service-proxies/service-proxies';

import { ArrayHelper } from '@shared/helpers/ArrayHelper';
import { CacheService } from 'ng2-cache-service';
import * as _ from 'underscore';
import { BankAccountsWidgetComponent } from '@shared/cfo/bank-accounts/bank-accounts-widgets/bank-accounts-widget.component';
import { BankAccountsService } from '@shared/cfo/bank-accounts/helpers/bank-accounts.service';
import { BankAccountsDataModel } from '@shared/cfo/bank-accounts/bank-accounts-widgets/bank-accounts-data.model';
import { AppConsts } from '@shared/AppConsts';

@Component({
    selector: 'bank-accounts-select',
    templateUrl: './bank-accounts-select.component.html',
    styleUrls: ['./bank-accounts-select.component.less'],
    providers: [ BankAccountsServiceProxy, BusinessEntityServiceProxy, CacheService, BankAccountsService ]
})
export class BankAccountsSelectComponent extends CFOComponentBase implements OnInit {
    @ViewChild(BankAccountsWidgetComponent) bankAccountWidget: BankAccountsWidgetComponent;
    @Input() targetBankAccountsTooltip = '';
    @Input() useGlobalCache = false;
    @Input() highlightedBankAccountIds = [];
    @Input() highlightUsedRows = false;
    @Input() showBusinessEntitiesFilter = true;
    @Input() showIsActiveFilter = true;
    @Input() emitOnlySelectedBankAccounts = false;

    @Output() onBankAccountsSelected: EventEmitter<any> = new EventEmitter();

    initDataSource: SyncAccountBankDto[] = [];
    syncAccountsDataSource: SyncAccountBankDto[] = [];
    tooltipVisible: boolean;
    bankAccountsCacheKey = `Dashboard_BankAccounts_${abp.session.tenantId}_${abp.session.userId}`;
    businessEntityExist = true;
    selectedBusinessEntityIds: any[] = [];
    businessEntities = [];
    isActive = true;
    selectedBankAccounts: number[] = null;
    storedVisibleBankAccountIds = [];

    constructor(
        injector: Injector,
        private _bankAccountsServiceProxy: BankAccountsServiceProxy,
        private _businessEntityService: BusinessEntityServiceProxy,
        private _cacheService: CacheService,
        private _bankAccountsService: BankAccountsService
    ) {
        super(injector);
        this._cacheService = this._cacheService.useStorage(AppConsts.CACHE_TYPE_LOCAL_STORAGE);
    }

    ngOnInit(): void {
        super.ngOnInit();
        this.getBusinessEntities();
        let res = this.handleSelectedBankAccounts();
        this.isActive = res.initIsActive;
        this.getBankAccounts(res.needEmitSelectedBankAccounts);
    }

    handleSelectedBankAccounts() {
        let initIsActive = true;
        let needEmitSelectedBankAccounts = true;
        if (this.useGlobalCache && this._cacheService.exists(this.bankAccountsCacheKey)) {
            let cacheData = this._cacheService.get(this.bankAccountsCacheKey);
            initIsActive = cacheData['isActive'] ? true : false;
            const selectedAccountsChanged = ArrayHelper.dataChanged(cacheData['selectedBankAccounts'], this.selectedBankAccounts);
            const syncAccountsChanged = ArrayHelper.dataChanged(cacheData['syncAccounts'], this.initDataSource);
            /** Check if selected bank account ids change */
            if (selectedAccountsChanged || syncAccountsChanged) {
                this.initDataSource = cacheData['syncAccounts'] || this.initDataSource;
                this.selectedBusinessEntityIds = cacheData['selectedBusinessEntityIds'] || this.selectedBusinessEntityIds;
                this.selectedBankAccounts = cacheData['selectedBankAccounts'] || this.selectedBankAccounts;
                this.storedVisibleBankAccountIds = cacheData['visibleBankAccountIds'] || this.storedVisibleBankAccountIds;
                let data = {
                    bankAccountIds: this.selectedBankAccounts || [],
                    isActive: initIsActive,
                    visibleAccountCount: this.storedVisibleBankAccountIds ? this.storedVisibleBankAccountIds.length : 0
                };
                if (syncAccountsChanged) {
                    this.filterDataSource(this.selectedBankAccounts);
                }
                this.onBankAccountsSelected.emit(data);
                needEmitSelectedBankAccounts = false;
            }
        }
        return { initIsActive: initIsActive, needEmitSelectedBankAccounts: needEmitSelectedBankAccounts };
    }

    isActiveChanged() {
        this.filterDataSource(null);
    }

    getBusinessEntities() {
        this._businessEntityService.getBusinessEntities(InstanceType[this.instanceType], this.instanceId)
            .subscribe((result) => {
                this.businessEntities = result;
                this.businessEntityExist = result.length > 0;
            });
    }

    businessEntitySelectedChange() {
        this.filterDataSource(null);
    }

    refreshSelected(bankAccountIds: any[]) {
        this.syncAccountsDataSource.forEach(syncAccount => {
            let selectedBankAccountCount = 0;
            syncAccount.bankAccounts.forEach(bankAccount => {
                let isBankAccountSelected = _.contains(bankAccountIds, bankAccount.id);
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
        if (this.bankAccountWidget)
            this.bankAccountWidget.refreshGrid();
    }

    bankAccountsClear() {
        this.refreshSelected([]);
        if (this.useGlobalCache)
            this._cacheService.set(this.bankAccountsCacheKey, {
                'selectedBankAccounts': [], 'isActive': this.isActive, 'selectedBusinessEntityIds': this.selectedBusinessEntityIds
            });

        let data = {};
        if (this.emitOnlySelectedBankAccounts) {
            data = this.getSelectedBankAccounts();
        } else {
            data = this.getVisibleBankAccounts();
        }

        this.onBankAccountsSelected.emit(data);
        this.tooltipVisible = false;
    }

    bankAccountsSelected() {
        let data = this.getSelectedBankAccounts();
        let visibleBankAccountIds = this.getVisibleBankAccounts().bankAccountIds;
        data.visibleAccountCount = visibleBankAccountIds ? visibleBankAccountIds.length : 0;

        if (this.useGlobalCache)
            this._cacheService.set(this.bankAccountsCacheKey, {
                'selectedBankAccounts': data.bankAccountIds,
                'isActive': this.isActive,
                'selectedBusinessEntityIds': this.selectedBusinessEntityIds,
                'visibleBankAccountIds': visibleBankAccountIds
            });

        this.onBankAccountsSelected.emit(data);
        this.tooltipVisible = false;
    }

    getVisibleBankAccounts() {
        return this.getBankAccountResult(bankAccount => true );
    }

    getSelectedBankAccounts() {
        return this.getBankAccountResult(bankAccount => bankAccount['selected'] );
    }

    private getBankAccountResult(expression) {
        let result = [];
        let usedResult = [];
        this.syncAccountsDataSource.forEach(syncAccount => {
            syncAccount.bankAccounts.forEach(bankAccount => {
                if (expression(bankAccount)) {
                    result.push(bankAccount.id);
                }
                if (bankAccount.isUsed) {
                    usedResult.push(bankAccount.id);
                }
            });
        });

        let data = {
            bankAccountIds: result,
            usedBankAccountIds: usedResult,
            isActive: this.isActive,
            visibleAccountCount: 0
        };
        return data;
    }

    toggleBankAccountTooltip() {
        this.tooltipVisible = !this.tooltipVisible;
    }

    getBankAccounts(needEmitSelectedAccounts = false): void {
        this._bankAccountsServiceProxy.getBankAccounts(InstanceType[this.instanceType], this.instanceId, 'USD')
            .subscribe((result) => {
                this.initDataSource = result;
                this.filterDataSource(this.selectedBankAccounts);
                let newSelected = this.getSelectedBankAccounts().bankAccountIds;
                if (_.difference(newSelected, this.selectedBankAccounts).length ||
                    _.difference(this.selectedBankAccounts, newSelected).length) {
                    this.selectedBankAccounts = newSelected;
                    needEmitSelectedAccounts = true;
                }
                if (this.useGlobalCache && needEmitSelectedAccounts) {
                    let bankAccountIds = this.selectedBankAccounts || [] ;
                    let data: BankAccountsDataModel = {
                        bankAccountIds: bankAccountIds,
                        isActive: this.isActive,
                        visibleAccountCount: 0
                    };
                    let getVisibleAccountsResult = this.getVisibleBankAccounts();
                    if (!this.emitOnlySelectedBankAccounts && !bankAccountIds.length) {
                        data = getVisibleAccountsResult;
                    }
                    data.visibleAccountCount = getVisibleAccountsResult.bankAccountIds.length;
                    this.onBankAccountsSelected.emit(data);
                }
            });
    }

    filterDataSource(selectedBankAccounts: number[]) {
        this.syncAccountsDataSource = this._bankAccountsService.filterDataSource(this.initDataSource, this.selectedBusinessEntityIds, selectedBankAccounts, this.storedVisibleBankAccountIds, this.isActive);
    }

    setSelectedBankAccounts(bankAccountIds) {
        this.selectedBankAccounts = bankAccountIds;
        this.refreshSelected(bankAccountIds);
        let visibleBankAccountIds = this.getVisibleBankAccounts();
        if (this.useGlobalCache)
            this._cacheService.set(this.bankAccountsCacheKey, {
                'syncAccounts': this.initDataSource,
                'selectedBankAccounts': bankAccountIds,
                'isActive': this.isActive,
                'selectedBusinessEntityIds': this.selectedBusinessEntityIds,
                'visibleBankAccountIds': visibleBankAccountIds.bankAccountIds
            });
    }
}
