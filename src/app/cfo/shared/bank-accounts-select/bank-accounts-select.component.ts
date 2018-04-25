import { Component, OnInit, Injector, Input, ViewChild, Output, EventEmitter } from '@angular/core';
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import { BankAccountsServiceProxy, InstanceType, SyncAccountBankDto, BusinessEntityServiceProxy, BankAccountDto } from 'shared/service-proxies/service-proxies';

import { CacheService } from 'ng2-cache-service';
import * as _ from 'underscore';
import { BankAccountsWidgetComponent } from 'shared/cfo/bank-accounts-widget/bank-accounts-widget.component';
import { BankAccountsService } from '@app/cfo/shared/helpers/bank-accounts.service';

@Component({
    selector: 'bank-accounts-select',
    templateUrl: './bank-accounts-select.component.html',
    styleUrls: ['./bank-accounts-select.component.less'],
    providers: [BankAccountsServiceProxy, BusinessEntityServiceProxy, CacheService, BankAccountsService]
})
export class BankAccountsSelectComponent extends CFOComponentBase implements OnInit {
    @ViewChild(BankAccountsWidgetComponent) bankAccountWidget: BankAccountsWidgetComponent;
    @Input() targetBankAccountsTooltip = '';
    @Input() useGlobalCache = false;
    @Input() highlightedBankAccountIds = [];
    @Input() highlightUsedRows = false;
    @Input() showBusinessEntitiesFilter = true;
    @Input() showIsActiveFilter = true;

    @Output() onBankAccountsSelected: EventEmitter<any> = new EventEmitter();

    private readonly LOCAL_STORAGE = 0;

    initDataSource: SyncAccountBankDto[] = [];
    syncAccountsDataSource: SyncAccountBankDto[] = [];
    tooltipVisible: boolean;
    bankAccountsCacheKey = `Dashboard_BankAccounts_${abp.session.tenantId}_${abp.session.userId}`;
    businessEntityExist = true;
    selectedBusinessEntityIds: any[] = [];
    businessEntities = [];
    isActive = true;
    selectedBankAccounts = [];

    constructor(
        injector: Injector,
        private _bankAccountsServiceProxy: BankAccountsServiceProxy,
        private _businessEntityService: BusinessEntityServiceProxy,
        private _cacheService: CacheService,
        private _bankAccountsService: BankAccountsService
    ) {
        super(injector);
        this._cacheService = this._cacheService.useStorage(this.LOCAL_STORAGE);
    }

    ngOnInit(): void {
        super.ngOnInit();
        this.getBusinessEntities();
        let initIsActive = true;
        if (this.useGlobalCache && this._cacheService.exists(this.bankAccountsCacheKey)) {
            let cacheData = this._cacheService.get(this.bankAccountsCacheKey);
            initIsActive = cacheData['isActive'] ? true : false;
            this.selectedBusinessEntityIds = cacheData['selectedBusinessEntityIds'];
            this.selectedBankAccounts = cacheData['bankAccounts'] || [];
        }
        this.isActive = initIsActive;
        this.getBankAccounts(true);
    }

    isActiveChanged() {
        this.filterDataSource();
    }

    getBusinessEntities() {
        this._businessEntityService.getBusinessEntities(InstanceType[this.instanceType], this.instanceId)
            .subscribe((result) => {
                this.businessEntities = result;
                this.businessEntityExist = result.length > 0;
            });
    }

    businessEntitySelectedChange() {
        this.filterDataSource();
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

    bankAccountsSelected() {
        let data = this.getSelectedBankAccounts();
        if (this.useGlobalCache)
            this._cacheService.set(this.bankAccountsCacheKey, {
                'bankAccounts': data.bankAccountIds, 'isActive': this.isActive, 'selectedBusinessEntityIds': this.selectedBusinessEntityIds
            });

        if (!data.bankAccountIds.length)
            data = this.getVisibleBankAccounts();

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
            usedBankAccountIds: usedResult
        };
        return data;
    }

    toggleBankAccountTooltip() {
        this.tooltipVisible = !this.tooltipVisible;
    }

    getBankAccounts(initial = false): void {
        this._bankAccountsServiceProxy.getBankAccounts(InstanceType[this.instanceType], this.instanceId, 'USD')
            .subscribe((result) => {
                this.initDataSource = result;
                this.filterDataSource();

                if (this.useGlobalCache && initial) {
                    let bankAccountIds = this._cacheService.exists(this.bankAccountsCacheKey)
                        ? this._cacheService.get(this.bankAccountsCacheKey)['bankAccounts']
                        : [];
                    if (!bankAccountIds)
                        bankAccountIds = [];
                    let data = {
                        bankAccountIds: bankAccountIds
                    };
                    if (!bankAccountIds.length) {
                        data = this.getVisibleBankAccounts();
                    }
                    this.onBankAccountsSelected.emit(data);
                }
            });
    }

    filterDataSource() {
        this.syncAccountsDataSource = this._bankAccountsService.filterDataSource(this.initDataSource, this.selectedBusinessEntityIds, this.selectedBankAccounts, this.isActive);
    }

    setSelectedBankAccounts(bankAccountIds) {
        this.selectedBankAccounts = bankAccountIds;
        this.refreshSelected(bankAccountIds);

        if (this.useGlobalCache)
            this._cacheService.set(this.bankAccountsCacheKey, {
                'bankAccounts': bankAccountIds, 'isActive': this.isActive, 'selectedBusinessEntityIds': this.selectedBusinessEntityIds
            });
    }
}
