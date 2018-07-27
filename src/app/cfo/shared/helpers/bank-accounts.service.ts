/** Core imports */
import { Injectable } from '@angular/core';

/** Third party imports */
import { Observable, BehaviorSubject, race, forkJoin, of, combineLatest } from 'rxjs';
import { first, reduce, mergeMap, map, filter, toArray } from 'rxjs/operators';
import { CacheService } from 'ng2-cache-service';
import * as _ from 'underscore';

/** Application imports */
import { SyncAccountBankDto, BankAccountDto, BankAccountsServiceProxy, BusinessEntityDto, BusinessEntityServiceProxy, InstanceType } from '@shared/service-proxies/service-proxies';
import { BankAccountsDataModel } from '@shared/cfo/bank-accounts-widgets/bank-accounts-data.model';
import { ArrayHelper } from '@shared/helpers/ArrayHelper';
import { FilterModel } from '@shared/filters/models/filter.model';
import { CFOService } from '@shared/cfo/cfo.service';

@Injectable()
export class BankAccountsService {
    syncAccounts$: Observable<SyncAccountBankDto[]>;
    allBusinessEntities$: Observable<BusinessEntityDto[]>;
    selectedBusinessEntities$: Observable<BusinessEntityDto[]>;
    selectedBusinessEntitiesIds$: Observable<number[]>;
    allBankAccounts$: Observable<BankAccountDto[]>;
    //filteredSyncAccounts$: Observable<SyncAccountBankDto[]>;
    bankAccountsCacheKey = `Dashboard_BankAccounts_${abp.session.tenantId}_${abp.session.userId}`;
    cachedData: BankAccountsDataModel = {
        selectedBankAccountIds: [],
        isActive: true,
        visibleAccountCount: 0,
        visibleBankAccountIds: [],
        selectedBusinessEntitiesIds: []
    };
    filteredBankAccounts$: Observable<BankAccountDto[]>;
    selectedBankAccounts$: Observable<BankAccountDto[]>;
    private _syncAccountFilter$: BehaviorSubject<BankAccountsDataModel> = new BehaviorSubject(this.cachedData);
    syncAccountFilter: Observable<BankAccountsDataModel> = this._syncAccountFilter$.asObservable();
    filteredSyncAccounts$: Observable<SyncAccountBankDto[]>;
    accountsDataTotalNetWorth$: Observable<number>;
    syncAccountsAmount$: Observable<string>;
    accountsAmount$: Observable<string>;

    constructor(private cfoService: CFOService,
                private bankAccountsServiceProxy: BankAccountsServiceProxy,
                private businessEntityService: BusinessEntityServiceProxy,
                private cacheService: CacheService) {
        this.cacheService = this.cacheService.useStorage(0);
        this.cachedData = { ...this.cachedData, ...this.cacheService.get(this.bankAccountsCacheKey) };
        this._syncAccountFilter$.next(this.cachedData);
    }

    load() {
        //this._syncAccountFilter$.next(this.cachedData);
        this.syncAccounts$ = this.bankAccountsServiceProxy.getBankAccounts(InstanceType[this.cfoService.instanceType], this.cfoService.instanceId, 'USD');
        this.allBankAccounts$ = this.syncAccounts$
            .pipe(
                mergeMap(x => x),
                reduce((bankAccounts: BankAccountDto[], syncAccount: SyncAccountBankDto) => {
                    return bankAccounts.concat(syncAccount.bankAccounts);
                }, [])
            );
        this.allBusinessEntities$ = this.businessEntityService.getBusinessEntities(InstanceType[this.cfoService.instanceType], this.cfoService.instanceId);

        this.selectedBusinessEntities$ =
            combineLatest(
                this.allBusinessEntities$,
                this.syncAccountFilter
            ).pipe(
                mergeMap(([businessEntities, dataFilter]) => {
                    const res = businessEntities.filter(businessEntity => {
                        return dataFilter.selectedBusinessEntitiesIds.indexOf(businessEntity.id) !== -1;
                    });
                    console.log(res);
                    return of(res);
                }),
                first()
            );

        this.selectedBusinessEntitiesIds$ = this.selectedBusinessEntities$.pipe(
            map(businessEntities => businessEntities.reduce(
                (entitiesIds, entity) => {
                    return entitiesIds.concat(entity.id);
                }, [])
            )
        )

        this.filteredSyncAccounts$ =
            combineLatest(
                this.syncAccounts$,
                this.syncAccountFilter
            ).pipe(
                mergeMap(([syncAccounts, dataFilter]) => {
                    return of(this.filterDataSource(
                        syncAccounts,
                        dataFilter.selectedBusinessEntitiesIds,
                        dataFilter.selectedBankAccountIds,
                        dataFilter.visibleBankAccountIds,
                        dataFilter.isActive
                    ));
                })
            );

        this.filteredBankAccounts$ = this.filteredSyncAccounts$.pipe(
            map(syncAccounts => syncAccounts.reduce((bankAccounts, syncAccount) => {
                return bankAccounts.concat(syncAccount.bankAccounts);
            }, []))
        );

        this.selectedBankAccounts$ = this.filteredBankAccounts$.pipe(
            map((bankAccounts: any) => {
                return bankAccounts.filter(bankAccount => bankAccount.selected);
            })
        );

        this.accountsDataTotalNetWorth$ = this.selectedBankAccounts$
            .pipe(
                map(bankAccounts => bankAccounts.reduce((sum, bankAccount) => {
                    return sum + bankAccount.balance;
                }, 0))
            );

        this.syncAccountsAmount$ = this.filteredSyncAccounts$
            .pipe(
                map((syncAccounts: any[]) => {
                    const selectedSyncAccounts = syncAccounts.filter(syncAccount => syncAccount.selected);
                    return selectedSyncAccounts.length === syncAccounts.length
                        ? selectedSyncAccounts.length.toString()
                        : `${selectedSyncAccounts.length} of ${syncAccounts.length}`;
                })
            );

        this.accountsAmount$ = this.filteredBankAccounts$
            .pipe(
                map((bankAccounts: any[]) => {
                    const selectedBankAccounts = bankAccounts.filter(bankAccount => bankAccount.selected);
                    return selectedBankAccounts.length === bankAccounts.length
                        ? selectedBankAccounts.length.toString()
                        : `${selectedBankAccounts .length} of ${bankAccounts.length}`;
                })
            );

    }

    changeFilter(filter: BankAccountsDataModel) {
        this.cachedData = {...this.cachedData, ...filter};
        this.cacheService.set(this.bankAccountsCacheKey, this.cachedData);
        this._syncAccountFilter$.next(this.cachedData);
    }

    changeSelectedBankAccountsIds(selectedBankAccountsIds: number[]) {
        this.cachedData.selectedBankAccountIds = selectedBankAccountsIds;
        this.cacheService.set(this.bankAccountsCacheKey, this.cachedData);
        this._syncAccountFilter$.next(this.cachedData);
    }

    changeSelectedBusinessEntities(selectedBusinessEntitiesIds: number[]) {
        if (selectedBusinessEntitiesIds) {
            this.cachedData.selectedBusinessEntitiesIds = selectedBusinessEntitiesIds;
            this.cacheService.set(this.bankAccountsCacheKey, this.cachedData);
            this._syncAccountFilter$.next(this.cachedData);
        }
    }

    filterDataSource(syncAccounts: SyncAccountBankDto[], businessEntitiesIds: number[], selectedAccountsIds: number[], visibleBankAccountsIds: number[], isActive = null): SyncAccountBankDto[] {
        let result: SyncAccountBankDto[] = [];
        visibleBankAccountsIds = !visibleBankAccountsIds || !selectedAccountsIds || selectedAccountsIds.length === 0 ? [] : visibleBankAccountsIds;
        syncAccounts.forEach(syncAccount => {
            if (!syncAccount.bankAccounts || !syncAccount.bankAccounts.length) {
                let syncAccountClone = _.clone(syncAccount);
                syncAccountClone['selected'] = false;
                result.push(syncAccountClone);
            } else {
                let selectedBankAccountCount = 0;
                let bankAccounts: BankAccountDto[] = [];
                syncAccount.bankAccounts.forEach(bankAccount => {
                    if ((!businessEntitiesIds.length || (bankAccount.businessEntityId && _.contains(businessEntitiesIds, bankAccount.businessEntityId)))
                        && (isActive === null || bankAccount.isActive === isActive)
                    ) {
                        let bankAccountClone = _.clone(bankAccount);
                        let isBankAccountSelected = (selectedAccountsIds ? _.contains(selectedAccountsIds, bankAccountClone.id) : true)
                            || (visibleBankAccountsIds.length ? !_.contains(visibleBankAccountsIds, bankAccountClone.id) : false);
                        bankAccountClone['selected'] = isBankAccountSelected;
                        if (isBankAccountSelected)
                            selectedBankAccountCount++;

                        bankAccounts.push(bankAccountClone);
                    }
                });
                if (bankAccounts.length) {
                    let syncAccountClone = _.clone(syncAccount);
                    syncAccountClone.bankAccounts = bankAccounts;

                    if (selectedBankAccountCount === 0) {
                        syncAccountClone['selected'] = false;
                    } else {
                        if (selectedBankAccountCount === syncAccountClone.bankAccounts.length) {
                            syncAccountClone['selected'] = true;
                        } else {
                            syncAccountClone['selected'] = undefined;
                        }
                    }

                    result.push(syncAccountClone);
                }
            }
        });
        return result;
    }

    changeAndGetBankAccountFilter(accountFilter: FilterModel, data: BankAccountsDataModel, initialDataSource: SyncAccountBankDto[]) {
        let accountFilterModel = <any>accountFilter.items.element;
        if (ArrayHelper.dataChanged(initialDataSource, accountFilterModel.dataSource)) {
            accountFilterModel.dataSource = initialDataSource;
        }
        if (data.selectedBankAccountIds) {
            accountFilter.items['element'].setValue(data.selectedBankAccountIds, accountFilter);
        } else {
            accountFilter.items['element'].setValue([], accountFilter);
        }
        return accountFilter;
    }

    getBankAccountCount(bankAccountIds: number[], visibleAccountCount: number) {
        let bankAccountCount;
        if (!bankAccountIds || !bankAccountIds.length)
            bankAccountCount = '';
        else if (!visibleAccountCount || bankAccountIds.length === visibleAccountCount)
            bankAccountCount = bankAccountIds.length;
        else
            bankAccountCount = bankAccountIds.length + ' of ' + visibleAccountCount;
        return bankAccountCount;
    }
}
