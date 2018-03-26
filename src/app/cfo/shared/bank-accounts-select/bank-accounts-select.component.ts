import { Component, OnInit, Injector, Input, ViewChild, Output, EventEmitter } from '@angular/core';
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import { BankAccountsServiceProxy, InstanceType, SyncAccountBankDto, BusinessEntityServiceProxy } from 'shared/service-proxies/service-proxies';

import { DxDataGridComponent } from 'devextreme-angular';
import { CacheService } from 'ng2-cache-service';
import * as _ from 'underscore';
import { BankAccountsWidgetComponent } from 'shared/cfo/bank-accounts-widget/bank-accounts-widget.component';

@Component({
    selector: 'bank-accounts-select',
    templateUrl: './bank-accounts-select.component.html',
    styleUrls: ['./bank-accounts-select.component.less'],
    providers: [BankAccountsServiceProxy, BusinessEntityServiceProxy, CacheService]
})
export class BankAccountsSelectComponent extends CFOComponentBase implements OnInit {
    private initSelectedBankAccountsTimeout: any;
    @ViewChild(BankAccountsWidgetComponent) bankAccountWidget: BankAccountsWidgetComponent;
    @Input() targetBankAccountsTooltip = '';
    @Input() useGlobalCache = false;
    @Input() highlightedBankAccountIds = [];
    @Input() highlightUsedRows = false;
    @Input() showBusinessEntitiesFilter = true;
    @Input() showIsActiveFilter = true;

    @Output() onBankAccountsSelected: EventEmitter<any> = new EventEmitter();

    private readonly LOCAL_STORAGE = 0;

    syncAccountsDataSource: SyncAccountBankDto[] = [];
    tooltipVisible: boolean;
    bankAccountsCacheKey = `Dashboard_BankAccounts_${abp.session.tenantId}_${abp.session.userId}`;
    allSelected = false;
    moreThanOneBusinessEntityExist = true;
    selectedBusinessEntities: any[];
    businessEntities = [];
    isActive = true;
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

    refreshSelected(bankAccountIds: any[]) {
        this.syncAccountsDataSource.forEach((syncAccount, i) => {
            let selectedBankAccountCount = 0;
            syncAccount.bankAccounts.forEach((bankAccount, i) => {
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

    bankAccountsSelecteAll() {
        this.syncAccountsDataSource.forEach((syncAccount, i) => {
            syncAccount.bankAccounts.forEach((bankAccount, i) => {
                bankAccount['selected'] = true;
            });
            syncAccount['selected'] = true;
        });

        if (this.bankAccountWidget)
            this.bankAccountWidget.refreshGrid();
    }

    bankAccountsClear() {
        this.refreshSelected([]);

        if (this.useGlobalCache)
            this._cacheService.set(this.bankAccountsCacheKey, {});

        this.onBankAccountsSelected.emit({
            bankAccountIds: [],
            usedBankAccountIds: []
        });
        this.tooltipVisible = false;
    }

    bankAccountsSelected() {
        let result = [];
        let usedResult = [];
        this.syncAccountsDataSource.forEach((syncAccount, i) => {
            syncAccount.bankAccounts.forEach((bankAccount, i) => {
                if (bankAccount['selected']) {
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
        if (this.useGlobalCache)
            this._cacheService.set(this.bankAccountsCacheKey, { 'bankAccounts': data.bankAccountIds, 'isActive': this.isActive });

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

                if (this.useGlobalCache && this._cacheService.exists(this.bankAccountsCacheKey)) {
                    let bankAccountIds = this._cacheService.get(this.bankAccountsCacheKey)['bankAccounts'];
                    this.refreshSelected(bankAccountIds);

                    if (initial) {
                        let data = {
                            bankAccountIds: bankAccountIds
                        };

                        this.onBankAccountsSelected.emit(data);
                    }
                } else {
                    this.refreshSelected([]);
                }
            });
    }

    getItems() {
        return this.syncAccountsDataSource;
    }

    setSelectedBankAccounts(bankAccountIds) {
        this.refreshSelected(bankAccountIds);
    }
}
