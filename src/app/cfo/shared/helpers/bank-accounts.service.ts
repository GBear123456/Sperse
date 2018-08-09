/** Core imports */
import { Injectable } from '@angular/core';

/** Third party imports */
import { Observable, BehaviorSubject, ReplaySubject, of, combineLatest } from 'rxjs';
import { first, finalize, mergeMap, map, distinctUntilChanged, refCount, publishReplay, withLatestFrom, switchMap } from 'rxjs/operators';
import { CacheService } from 'ng2-cache-service';
import * as _ from 'underscore';

/** Application imports */
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { SyncAccountBankDto, BankAccountDto, BankAccountsServiceProxy, BusinessEntityDto, BusinessEntityServiceProxy, InstanceType, InstanceType7 } from '@shared/service-proxies/service-proxies';
import { BankAccountsDataModel } from '@shared/cfo/bank-accounts-widgets/bank-accounts-data.model';
import { ArrayHelper } from '@shared/helpers/ArrayHelper';
import { FilterModel } from '@shared/filters/models/filter.model';
import { CFOService } from '@shared/cfo/cfo.service';

@Injectable()
export class BankAccountsService {
    acceptFilterOnlyOnApply = true;
    filteredSyncAccounts$: Observable<SyncAccountBankDto[]>;
    filteredSyncAccountsWithApply$: Observable<SyncAccountBankDto[]>;
    filteredSyncAccountsSource$: Observable<SyncAccountBankDto[]>;
    filteredSyncAccountsWithType$: Observable<SyncAccountBankDto[]>;
    distinctUntilChangedFilteredSyncAccounts$: Observable<SyncAccountBankDto[]>;
    allBusinessEntities$: Observable<BusinessEntityDto[]>;
    businessEntitiesAmount$: Observable<number>;
    selectedBusinessEntities$: Observable<BusinessEntityDto[]>;
    selectedBusinessEntitiesIds$: Observable<number[]>;
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
    selectedBankAccountsIds$: Observable<number[]>;
    _syncAccountFilter: BehaviorSubject<BankAccountsDataModel> = new BehaviorSubject(this.cachedData);
    syncAccountFilter$: Observable<BankAccountsDataModel> = this._syncAccountFilter.asObservable();
    accountsDataTotalNetWorth$: Observable<number>;
    syncAccountsAmount$: Observable<string>;
    accountsAmount$: Observable<string>;
    existingBankAccountsTypes$: Observable<string[]>;
    baseBankAccountTypes = ['Checking', 'Savings', 'Credit Card'];
    allAccountTypesFilter = this.localizationService.l('AllAccounts');
    private _selectedBankAccountType: BehaviorSubject<string> = new BehaviorSubject(this.allAccountTypesFilter);
    selectedBankAccountType$: Observable<string> = this._selectedBankAccountType.asObservable();

    private _applyFilter = new BehaviorSubject(null);
    applyFilter$ = this._applyFilter.asObservable();
    _syncAccounts: ReplaySubject<SyncAccountBankDto[]> = new ReplaySubject(1);
    syncAccounts$ = this._syncAccounts.asObservable();
    syncAccountsRequest$;

    constructor(private cfoService: CFOService,
                private bankAccountsServiceProxy: BankAccountsServiceProxy,
                private businessEntityService: BusinessEntityServiceProxy,
                private cacheService: CacheService,
                private localizationService: AppLocalizationService) {
        this.cacheService = this.cacheService.useStorage(0);
        this.load();
    }

    load(acceptFilterOnlyOnApply = true) {

        this.acceptFilterOnlyOnApply = acceptFilterOnlyOnApply;
        this._selectedBankAccountType.next(this._selectedBankAccountType.value);
        this.allBusinessEntities$ = this.businessEntityService.getBusinessEntities(InstanceType7.Main, undefined).pipe(
            publishReplay(),
            refCount()
        );
        this.businessEntitiesAmount$ = this.allBusinessEntities$.pipe(map(businessEntities => businessEntities.length));

        this.selectedBusinessEntities$ =
            combineLatest(
                this.allBusinessEntities$,
                this.syncAccountFilter$
            ).pipe(
                mergeMap(([businessEntities, dataFilter]) => {
                    const res = businessEntities.filter(businessEntity => {
                        return dataFilter.selectedBusinessEntitiesIds.indexOf(businessEntity.id) !== -1;
                    });
                    return of(res);
                }),
                distinctUntilChanged((oldEntities, newEntities) => !ArrayHelper.dataChanged(oldEntities, newEntities))
            );

        this.selectedBusinessEntitiesIds$ = this.selectedBusinessEntities$.pipe(
            map(businessEntities => businessEntities.reduce(
                (entitiesIds, entity) => {
                    return entitiesIds.concat(entity.id);
                }, [])
            ),
            distinctUntilChanged((oldIds, newIds) => !ArrayHelper.dataChanged(oldIds, newIds))
        );

        this.existingBankAccountsTypes$ = this.syncAccounts$.pipe(
            map( syncAccounts => {
                let existBankAccountTypes = [];
                syncAccounts.forEach(syncAccount => {
                    let types = _.uniq(_.map(syncAccount.bankAccounts, bankAccount => bankAccount.typeName));
                    existBankAccountTypes = _.union(existBankAccountTypes, types);
                });
                let bankAccountTypesForSelect = [];
                bankAccountTypesForSelect.push(this.allAccountTypesFilter);
                this.baseBankAccountTypes.forEach(type => {
                    bankAccountTypesForSelect.push(type);
                });

                let otherExist = _.some(existBankAccountTypes, x => !_.contains(this.baseBankAccountTypes, x));
                if (otherExist)
                    bankAccountTypesForSelect.push(this.localizationService.l('Other'));

                return bankAccountTypesForSelect;
            }),
            distinctUntilChanged((oldTypes, newTypes) => !ArrayHelper.dataChanged(oldTypes, newTypes))
        );

        this.filteredSyncAccountsWithType$ =
            combineLatest(
                this.syncAccounts$,
                this.selectedBankAccountType$,
                this.existingBankAccountsTypes$
            ).pipe(
                mergeMap(([syncAccounts, selectedType, allTypes]) => {
                    return of(this.filterByBankAccountType(syncAccounts, selectedType, allTypes));
                })
            );

        this.filteredSyncAccounts$ = combineLatest(
            this.filteredSyncAccountsWithType$,
            this.syncAccountFilter$
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

        this.distinctUntilChangedFilteredSyncAccounts$ = this.filteredSyncAccounts$
            .pipe(
                distinctUntilChanged(this.checkDistinct)
            );

        this.filteredSyncAccountsWithApply$ =
            this.filteredSyncAccounts$.pipe(
                first(),
                switchMap(() => {
                    return this.applyFilter$;
                }),
                withLatestFrom(this.filteredSyncAccounts$, (apply, filteredAccounts) => {
                    return filteredAccounts;
                })
            );

        /** @todo check how to get which data was latest from combineLatest */
        this.filteredSyncAccountsSource$ = this.filteredSyncAccounts$.pipe(
            first(),
            switchMap(() => {
                return combineLatest(
                    this.filteredSyncAccounts$,
                    this.filteredSyncAccountsWithApply$
                ).pipe(
                    map(([filtered, filteredWithApply]) => {
                        return this.acceptFilterOnlyOnApply ? filteredWithApply : filtered;
                    })
                );
            })
        );

        this.filteredBankAccounts$ = this.filteredSyncAccountsSource$.pipe(
            map(syncAccounts => syncAccounts.reduce((bankAccounts, syncAccount) => {
                return bankAccounts.concat(syncAccount.bankAccounts);
            }, []))
        );

        this.selectedBankAccounts$ = this.filteredBankAccounts$.pipe(
            map((bankAccounts: any) => {
                return bankAccounts.filter(bankAccount => bankAccount.selected);
            })
        );

        this.selectedBankAccountsIds$ = this.selectedBankAccounts$.pipe(
            map(bankAccounts => {
                return bankAccounts.map(account => account.id);
            }),
            distinctUntilChanged((oldAccountsIds, newAccountsIds) => {
                return !ArrayHelper.dataChanged(oldAccountsIds, newAccountsIds);
            })
        );

        this.selectedBankAccountsIds$.subscribe(
            ids => {
                this.cachedData.selectedBankAccountIds = ids;
            }
        );

        this.accountsDataTotalNetWorth$ = this.selectedBankAccounts$
            .pipe(
                map(bankAccounts => bankAccounts.reduce((sum, bankAccount) => {
                    return sum + bankAccount.balance;
                }, 0)),
                distinctUntilChanged()
            );

        this.syncAccountsAmount$ = this.filteredSyncAccountsSource$
            .pipe(
                map((syncAccounts: any[]) => {
                    /** Selected can be true, false or undefined. Undefined if bank accounts of the sync account are partially selected */
                    const selectedSyncAccounts = syncAccounts.filter(syncAccount => syncAccount.selected !== false);
                    return selectedSyncAccounts.length === syncAccounts.length
                        ? selectedSyncAccounts.length.toString()
                        : `${selectedSyncAccounts.length} of ${syncAccounts.length}`;
                }),
                distinctUntilChanged()
            );

        this.accountsAmount$ = this.filteredBankAccounts$
            .pipe(
                map((bankAccounts: any[]) => {
                    const selectedBankAccounts = bankAccounts.filter(bankAccount => bankAccount.selected);
                    return selectedBankAccounts.length === bankAccounts.length
                        ? selectedBankAccounts.length.toString()
                        : `${selectedBankAccounts .length} of ${bankAccounts.length}`;
                }),
                distinctUntilChanged()
            );

        return this.syncAccounts$;
    }

    loadSyncAccounts(acceptFilterOnlyOnApply = true) {
        if (!this.syncAccountsRequest$) {
            this.acceptFilterOnlyOnApply = acceptFilterOnlyOnApply;

            this.cachedData = {...this.cachedData, ...this.cacheService.get(this.bankAccountsCacheKey)};
            this._syncAccountFilter.next(this.cachedData);

            this.syncAccountsRequest$ = this.bankAccountsServiceProxy.getBankAccounts(InstanceType[this.cfoService.instanceType], this.cfoService.instanceId, 'USD').pipe(publishReplay(), refCount());
            this.syncAccountsRequest$
                .pipe(finalize(() => { this.syncAccountsRequest$ = null; }))
                .subscribe(syncAccounts => {
                    /** Load sync account and if they changed - */
                    //if (!this.syncAccounts$.source['_events'][0] || !this.syncAccounts$.source['_events'][0].length || ArrayHelper.dataChanged(this.syncAccounts$.source['_events'][0], syncAccounts)) {
                    this._syncAccounts.next(syncAccounts);
                    //}
                });
        }

        return this.syncAccountsRequest$;
    }

    checkDistinct = (oldSyncAccounts: any[], newSyncAccounts: any[]) => {
        const oldSyncAccountsIds = oldSyncAccounts.map(syncAccount => syncAccount.syncAccountId);
        const newSyncAccountsIds = newSyncAccounts.map(syncAccount => syncAccount.syncAccountId);
        return !ArrayHelper.dataChanged(oldSyncAccountsIds, newSyncAccountsIds);
    }

    filterByBankAccountType(syncAccounts, type, allTypes) {
        let filteredSyncAccounts = [];

        syncAccounts.forEach(syncAccount => {
            let syncAccountCopy: any = { ...{}, ...syncAccount };
            syncAccountCopy['bankAccounts'] = [];
            if (type === this.allAccountTypesFilter) {
                syncAccount.bankAccounts.forEach(bankAccount => {
                    syncAccountCopy.bankAccounts.push({ ...{}, ...bankAccount });
                });
                if (syncAccount.bankAccounts.length > 0) {
                    filteredSyncAccounts.push(syncAccountCopy);
                }
            } else if (type === this.localizationService.l('Other')) {
                syncAccount.bankAccounts.forEach(bankAccount => {
                    let isBankAccountVisible = !_.contains(allTypes, bankAccount.typeName);
                    if (isBankAccountVisible) {
                        syncAccountCopy.bankAccounts.push({ ...{}, ...bankAccount});
                    }
                });
                if (syncAccountCopy.bankAccounts.length) {
                    filteredSyncAccounts.push(syncAccountCopy);
                }
            } else {
                syncAccount.bankAccounts.forEach(bankAccount => {
                    let isBankAccountVisible = type === bankAccount.typeName;
                    if (isBankAccountVisible) {
                        syncAccountCopy.bankAccounts.push({ ...{}, ...bankAccount});
                    }
                });
                if (syncAccountCopy.bankAccounts.length) {
                    filteredSyncAccounts.push(syncAccountCopy);
                }
            }
        });
        return filteredSyncAccounts;
    }

    changeFilter(filter: BankAccountsDataModel, saveInCache = true) {
        let tempFilter = { ...this.cachedData, ...filter};
        if (saveInCache) {
            this.cachedData = tempFilter;
            this.cacheService.set(this.bankAccountsCacheKey, this.cachedData);
        }
        this._syncAccountFilter.next(tempFilter);
    }

    applyFilter() {
        this._applyFilter.next(null);
    }

    changeSelectedBankAccountsIds(selectedBankAccountsIds: number[], saveInCache = true) {
        if (selectedBankAccountsIds) {
            this.changeFilter({
                selectedBankAccountIds: selectedBankAccountsIds
            }, saveInCache);
        }
    }

    changeSelectedBusinessEntities(selectedBusinessEntitiesIds: number[], saveInCache = true) {
        if (selectedBusinessEntitiesIds) {
            this.changeFilter({
                selectedBusinessEntitiesIds: selectedBusinessEntitiesIds
            }, saveInCache);
        }
    }

    changeBankAccountType(type: string) {
        this._selectedBankAccountType.next(type);
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

    changeActiveFilter(value: boolean) {
        this.changeFilter({
            isActive: value,
            selectedBankAccountIds: null
        });
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

}
