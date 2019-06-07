/** Core imports */
import { Injectable } from '@angular/core';

/** Third party imports */
import { Observable, BehaviorSubject, ReplaySubject, of, combineLatest, forkJoin } from 'rxjs';
import {
    debounceTime,
    distinctUntilChanged,
    first,
    finalize,
    mergeAll,
    mergeMap,
    map,
    refCount,
    pluck,
    publishReplay,
    tap,
    toArray,
    withLatestFrom,
    switchMap
} from 'rxjs/operators';
import { CacheService } from 'ng2-cache-service';
import * as _ from 'underscore';

/** Application imports */
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { SyncAccountBankDto, BankAccountDto, BankAccountsServiceProxy, BusinessEntityDto, BusinessEntityServiceProxy, InstanceType } from '@shared/service-proxies/service-proxies';
import { BankAccountsState } from '@shared/cfo/bank-accounts-widgets/bank-accounts-state.model';
import { ArrayHelper } from '@shared/helpers/ArrayHelper';
import { FiltersService } from '@shared/filters/filters.service';
import { FilterModel } from '@shared/filters/models/filter.model';
import { CFOService } from '@shared/cfo/cfo.service';
import { CfoPreferencesService } from '@app/cfo/cfo-preferences.service';
import { BankAccountStatus } from '@shared/cfo/bank-accounts/helpers/bank-accounts.status.enum';
import { BankAccountType } from '@shared/cfo/bank-accounts/helpers/bank-account-type.model';

@Injectable()
export class BankAccountsService {
    acceptFilterOnlyOnApply = true;
    filteredSyncAccounts$: Observable<SyncAccountBankDto[]>;
    filteredSyncAccountsWithApply$: Observable<SyncAccountBankDto[]>;
    filteredSyncAccountsSource$: Observable<SyncAccountBankDto[]>;
    filteredSyncAccountsWithType$: Observable<SyncAccountBankDto[]>;
    distinctUntilChangedFilteredSyncAccounts$: Observable<SyncAccountBankDto[]>;
    businessEntitiesAmount$: Observable<number>;
    selectedBusinessEntities$: Observable<BusinessEntityDto[]>;
    selectedBusinessEntitiesIds$: Observable<number[]>;
    bankAccountsCacheKey = `Dashboard_BankAccounts_${abp.session.tenantId}_${abp.session.userId}_${this.cfoService.instanceType}`;
    state: BankAccountsState = {
        selectedBankAccountIds: [],
        statuses: [
            BankAccountStatus.Active
        ],
        usedBankAccountIds: [],
        visibleBankAccountIds: [],
        selectedBusinessEntitiesIds: []
    };
    filteredBankAccounts$: Observable<BankAccountDto[]>;
    filteredBankAccountsIds: number[];
    filteredBankAccountsIds$: Observable<number[]>;
    filteredBankAccountsStatus$: Observable<string>;
    selectedBankAccounts$: Observable<BankAccountDto[]>;
    selectedBankAccountsIds$: Observable<number[]>;
    _syncAccountsState: BehaviorSubject<BankAccountsState> = new BehaviorSubject(this.state);
    syncAccountsState$: Observable<BankAccountsState> = this._syncAccountsState.asObservable();
    accountsDataTotalNetWorth$: Observable<number>;
    allSyncAccountAreSelected$: Observable<boolean>;
    syncAccountsAmount$: Observable<string>;
    accountsAmount$: Observable<string>;
    existingBankAccountsTypes$: Observable<BankAccountType[]>;
    private _selectedBankAccountTypes: BehaviorSubject<string[]> = new BehaviorSubject([]);
    selectedBankAccountTypes$: Observable<string[]> = this._selectedBankAccountTypes.asObservable();

    private _applyFilter = new BehaviorSubject(null);
    applyFilter$ = this._applyFilter.asObservable();
    _syncAccounts: ReplaySubject<SyncAccountBankDto[]> = new ReplaySubject(1);
    _businessEntities: ReplaySubject<BusinessEntityDto[]> = new ReplaySubject(1);
    syncAccounts$: Observable<SyncAccountBankDto[]>;
    businessEntities$: Observable<BusinessEntityDto[]>;
    syncAccountsRequest$;
    businessEntitiesRequest$;
    searchValue: BehaviorSubject<string> = new BehaviorSubject<string>('');
    searchValue$: Observable<string> = this.searchValue.asObservable().pipe(
        debounceTime(300),
        distinctUntilChanged(),
        map(searchString => searchString.toLowerCase())
    );

    allStatuses = [
        {
            name: this.ls.l('Active'),
            id: BankAccountStatus.Active
        },
        {
            name: this.ls.l('Disabled'),
            id: BankAccountStatus.Disabled
        }
    ];
    selectedStatuses: BehaviorSubject<BankAccountStatus[]> = new BehaviorSubject(this.state.statuses);
    selectedStatuses$ = this.selectedStatuses.asObservable();

    constructor(
        private cfoService: CFOService,
        private bankAccountsServiceProxy: BankAccountsServiceProxy,
        private businessEntityService: BusinessEntityServiceProxy,
        private cacheService: CacheService,
        private _filtersService: FiltersService,
        private localizationService: AppLocalizationService,
        private cfoPreferencesService: CfoPreferencesService,
        private ls: AppLocalizationService
    ) {
        this.cfoService.instanceTypeChanged$.subscribe(instanceType => {
            this.bankAccountsCacheKey = `Dashboard_BankAccounts_${abp.session.tenantId}_${abp.session.userId}_${instanceType}`;
        });
        this.syncAccounts$ = this._syncAccounts.asObservable().pipe(distinctUntilChanged(this.arrayDistinct));
        this.businessEntities$ = this._businessEntities.asObservable().pipe(distinctUntilChanged(this.arrayDistinct));
/*
        this.bankAccounts$ = this.syncAccounts$
            .pipe(
                mergeMap(x => x),
                reduce((bankAccounts: BankAccountDto[], syncAccount: SyncAccountBankDto) => {
                    return bankAccounts.concat(syncAccount.bankAccounts);
                }, [])
            );
*/
        this.businessEntitiesAmount$ = this.businessEntities$.pipe(
            map(businessEntities => businessEntities.length),
            distinctUntilChanged()
        );

        this.selectedBusinessEntities$ =
            combineLatest(
                this.businessEntities$,
                this.syncAccountsState$
            ).pipe(
                mergeMap(([businessEntities, state]) => {
                    const res = businessEntities.filter(businessEntity => {
                        return state.selectedBusinessEntitiesIds.indexOf(businessEntity.id) !== -1;
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

        /**
         * Get array of unique accounts types
         * @type {Observable<string[]>}
         */
        this.existingBankAccountsTypes$ = this.syncAccounts$.pipe(
            first(),
            mergeAll(),
            pluck('bankAccounts'),
            mergeAll(),
            pluck('typeName'),
            map((typeName: string) => typeName || this.localizationService.l('NoType')),
            toArray(),
            map((types) => {
                return types.reduce((types: BankAccountType[], type: string) => {
                    let currentType = types.find(t => t.name === type);
                    if (currentType) {
                        currentType.count += 1;
                    } else {
                        types.push({
                            id: type,
                            name: type,
                            count: 1
                        });
                    }
                    return types;
                }, []);
            }),
            tap(x => console.log('types', x)),
            map((types: { name: string, count: number }[]) => types.sort(this.sortBankAccountsTypes)),
            distinctUntilChanged(this.arrayDistinct)
        );

        this.filteredSyncAccountsWithType$ =
            combineLatest(
                this.syncAccounts$,
                this.selectedBankAccountTypes$,
                this.existingBankAccountsTypes$
            ).pipe(
                map(([syncAccounts, selectedTypes, allTypes]) => {
                   return this.filterByBankAccountTypes(syncAccounts, selectedTypes, allTypes);
                }),
                distinctUntilChanged(this.arrayDistinct)
            );

        let combinedFilteredSyncAccounts$ = combineLatest(
            this.filteredSyncAccountsWithType$,
            this.syncAccountsState$,
            this.searchValue$
        );

        this.filteredSyncAccounts$ = combinedFilteredSyncAccounts$.pipe(
            mergeMap(([syncAccounts, state, searchValue]) => {
                return of(this.filterDataSource(
                    syncAccounts,
                    state.selectedBusinessEntitiesIds,
                    state.selectedBankAccountIds,
                    state.visibleBankAccountIds,
                    searchValue,
                    state.statuses
                ));
            }),
            distinctUntilChanged(this.arrayDistinct)
        );

        let filteredSyncAccountsAmount$ = combinedFilteredSyncAccounts$.pipe(
            mergeMap(([syncAccounts, state, searchValue]) => {
                return of(this.filterDataSource(
                    syncAccounts, [], state.selectedBankAccountIds,
                    state.visibleBankAccountIds, searchValue, state.statuses
                ));
            }),
            distinctUntilChanged()
        );

        let filteredBankAccountsAmount$ = filteredSyncAccountsAmount$.pipe(
            map(syncAccounts => {
                return syncAccounts.reduce((total, syncAccount) => {
                        return total + syncAccount.bankAccounts.length;
                    }, 0
                );
            }),
            distinctUntilChanged()
        );

        /** Stream of posible bank accounts */
        // this.posibleSelectedBankAccountsIds$ =
        //     /** Implemented pauser to allow to update all values and then run combineLatest (it runs only once) */
        //     this._pauser.pipe(
        //         switchMap(paused => {
        //             return paused ? never() : combineLatest(
        //                 this.bankAccounts$,
        //                 this.selectedBusinessEntitiesIds$,
        //                 this.selectedBankAccountType$,
        //                 this.activeStatus$
        //             ).pipe(
        //                 mergeMap(([bankAccounts, selectedBusinessEntities, selectedType, activeStatus]) => {
        //                     return (this.getPosibleSelectedBankAccountsIds(bankAccounts, activeStatus, selectedBusinessEntities, selectedType));
        //                 }),
        //                 distinctUntilChanged(this.arrayDistinct)
        //             );
        //         })
        //     );

        this.distinctUntilChangedFilteredSyncAccounts$ = this.filteredSyncAccounts$
            .pipe(
                distinctUntilChanged(this.accountsChanged)
            );

        this.filteredSyncAccountsWithApply$ =
            this.filteredSyncAccounts$.pipe(
                first(),
                switchMap(() => this.applyFilter$),
                withLatestFrom(this.filteredSyncAccounts$, (apply, filteredAccounts) => {
                    return filteredAccounts;
                }),
                distinctUntilChanged(this.arrayDistinct)
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
            }),
            distinctUntilChanged(this.arrayDistinct)
        );

        this.filteredBankAccounts$ = this.getFilteredBankAccounts(this.filteredSyncAccountsSource$);

        this.filteredBankAccountsIds$ = this.filteredBankAccounts$.pipe(
            map(bankAccounts => bankAccounts.map(bankAccount => bankAccount.id)),
            distinctUntilChanged(this.arrayDistinct)
        );

        this.filteredBankAccountsIds$.subscribe(ids => {
            this.filteredBankAccountsIds = ids;
        });

        this.filteredBankAccountsStatus$ = this.filteredBankAccounts$.pipe(
            switchMap((bankAccounts: BankAccountDto[]) => {
                return bankAccounts && bankAccounts.length
                    ? this.selectedStatuses$.pipe(
                         map((statuses: BankAccountStatus[]) => {
                             return statuses.length === this.allStatuses.length ? this.ls.l('All') : statuses.map(status => this.allStatuses.find(s => s.id === status).name).join(', ');
                         })
                      )
                    : of('');
            }),
            distinctUntilChanged()
        );

        this.selectedBankAccounts$ = this.filteredBankAccounts$.pipe(
            map((bankAccounts: any) => {
                return bankAccounts.filter(bankAccount => bankAccount.selected);
            }),
            distinctUntilChanged(this.arrayDistinct)
        );

        this.selectedBankAccountsIds$ = this.selectedBankAccounts$.pipe(
            map(bankAccounts => {
                return bankAccounts.map(account => account.id);
            }),
            distinctUntilChanged(this.arrayDistinct)
        );

        this.selectedBankAccountsIds$.pipe(
            withLatestFrom(this.filteredBankAccountsIds$)
        ).subscribe(
            ([selectedAccountsIds, filteredAccountsIds]) => {
                /** If selected bank accounts sets to none - select all filtered */
                if (!selectedAccountsIds || !selectedAccountsIds.length) {
                    if (this.acceptFilterOnlyOnApply) {
                        this.changeSelectedBankAccountsIds(filteredAccountsIds);
                        this.applyFilter();
                    }
                } else {
                    /** If selected are differ from saved in store - update store */
                    if (ArrayHelper.dataChanged(selectedAccountsIds, this.state.selectedBankAccountIds)) {
                        this.state.selectedBankAccountIds = selectedAccountsIds;
                        this.cacheService.set(this.bankAccountsCacheKey, this.state);
                    }
                }
            }
        );

        this.accountsDataTotalNetWorth$ = this.selectedBankAccounts$
            .pipe(
                map(bankAccounts => bankAccounts.reduce((sum, bankAccount) => {
                    return sum + bankAccount.balance;
                }, 0)),
                distinctUntilChanged()
            );

        this.allSyncAccountAreSelected$ = this.filteredSyncAccounts$.pipe(
            map((syncAccounts: any[]) => {
                const selectedSyncAccounts = syncAccounts.filter(syncAccount => syncAccount.selected !== false);
                return selectedSyncAccounts.length === syncAccounts.length;
            })
        );

        this.syncAccountsAmount$ = this.filteredSyncAccounts$.pipe(
            map((syncAccounts: any[]) => {
                /** Selected can be true, false or undefined. Undefined if bank accounts of the sync account are partially selected */
                const selectedSyncAccounts = syncAccounts.filter(syncAccount => syncAccount.selected !== false);
                return selectedSyncAccounts.length === syncAccounts.length
                    ? selectedSyncAccounts.length.toString()
                    : `${selectedSyncAccounts.length} of ${syncAccounts.length}`;
            }),
            distinctUntilChanged()
        );

        this.accountsAmount$ = combineLatest(this.getFilteredBankAccounts(this.filteredSyncAccounts$), filteredBankAccountsAmount$)
            .pipe(
                map(([bankAccounts, totalAmount]: [any[], number]) => {
                    const selectedBankAccounts = bankAccounts.filter(bankAccount => bankAccount.selected);
                    return selectedBankAccounts.length === totalAmount
                        ? selectedBankAccounts.length.toString()
                        : `${selectedBankAccounts.length} of ${totalAmount}`;
                }),
                distinctUntilChanged()
            );

    }

    loadState() {

        /** Get fitler data from cache and apply it to update all accounts */
        this.state = {...this.state, ...this.cacheService.get(this.bankAccountsCacheKey)};
        this._syncAccountsState.next(this.state);

        if (this.acceptFilterOnlyOnApply && (!this.state.selectedBankAccountIds || !this.state.selectedBankAccountIds.length)) {
            this.changeSelectedBankAccountsIds(this.filteredBankAccountsIds);
            this.applyFilter();
        }

        /** @todo think about application state handling with posibleAccountsIds stream */
        /** Start pause to avoid multiple filtering in combine latest */
        //this._pauser.next(true);
        //this._activeStatus.next(this.state.isActive);
        //this.selectedBusinessEntitiesIds$
        /** Finish pause */
        //this._pauser.next(false);
    }

    load(acceptFilterOnlyOnApply = true) {
        /** Change accept value */
        this.acceptFilterOnlyOnApply = acceptFilterOnlyOnApply;

        this.loadState();

        if (!this.syncAccountsRequest$) {
            this.syncAccountsRequest$ = this.cfoPreferencesService.getCurrencyId().pipe(
                switchMap((currencyId: string) => this.bankAccountsServiceProxy.getBankAccounts(InstanceType[this.cfoService.instanceType], this.cfoService.instanceId, currencyId)),
                publishReplay(),
                refCount()
            );
            this.syncAccountsRequest$
                .pipe(finalize(() => { this.syncAccountsRequest$ = null; }))
                .subscribe(syncAccounts => {
                    this._syncAccounts.next(syncAccounts);
                });
        }

        if (!this.businessEntitiesRequest$) {
            this.businessEntitiesRequest$ = this.businessEntityService.getBusinessEntities(InstanceType[this.cfoService.instanceType], this.cfoService.instanceId).pipe(
                publishReplay(),
                refCount()
            );

            this.businessEntitiesRequest$
                .pipe(finalize(() => { this.businessEntitiesRequest$ = null; }))
                .subscribe(businessEntities => {
                    this._businessEntities.next(businessEntities);
                });
        }

        const combinedRequest = forkJoin(
            this.syncAccountsRequest$,
            this.businessEntitiesRequest$
        );

        combinedRequest.subscribe(() => {
            this.filteredSyncAccounts$.pipe(first()).subscribe(() => {
                this.applyFilter();
            });
        });

        return combinedRequest;
    }

    private getFilteredBankAccounts(syncAccounts$: Observable<SyncAccountBankDto[]>) {
        return syncAccounts$.pipe(
            map(syncAccounts => {
                return syncAccounts.reduce((bankAccounts, syncAccount) => {
                        return bankAccounts.concat(syncAccount.bankAccounts);
                    }, []
                );
            }),
            distinctUntilChanged(this.arrayDistinct)
        );
    }

    /**
     * Sort by alphabet but 'No Type' at the end
     * @param type1
     * @param type2
     * @return {number}
     */
    private sortBankAccountsTypes = (type1, type2) => {
        let result = 0;
        if (type2.name === this.localizationService.l('NoType') || type1.name < type2.name) {
            result = -1;
        } else if (type1.name === this.localizationService.l('NoType') || type2.name > type1.name) {
            result = 1;
        }
        return result;
    }

    /** Check if sync accounts and bank accounts changed */
    accountsChanged = (oldSyncAccounts: any[], newSyncAccounts: any[]) => {
        return !ArrayHelper.dataChanged(oldSyncAccounts, newSyncAccounts);
    }

    arrayDistinct = (oldData, newData) => !ArrayHelper.dataChanged(oldData, newData);

    filterByBankAccountTypes(syncAccounts, selectedTypes: string[], allTypes) {
        let filteredSyncAccounts = [];

        syncAccounts.forEach(syncAccount => {
            let syncAccountCopy: any = { ...{}, ...syncAccount };
            syncAccountCopy['bankAccounts'] = [];
            if (!selectedTypes.length || selectedTypes.length === allTypes.length) {
                syncAccount.bankAccounts.forEach(bankAccount => {
                    syncAccountCopy.bankAccounts.push({ ...{}, ...bankAccount });
                });
                filteredSyncAccounts.push(syncAccountCopy);
            } else {
                syncAccount.bankAccounts.forEach(bankAccount => {
                    let isBankAccountVisible = selectedTypes.indexOf(bankAccount.typeName) > -1
                        || (
                            !bankAccount.typeName
                            && selectedTypes.indexOf(this.localizationService.l('NoType')) !== -1
                        );
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

    changeState(state: BankAccountsState, saveInCache = true) {
        let tempFilter = { ...this.state, ...state};
        if (saveInCache) {
            this.state = tempFilter;
            this.cacheService.set(this.bankAccountsCacheKey, this.state);
        }
        this._syncAccountsState.next(tempFilter);
    }

    applyFilter() {
        this._applyFilter.next(null);
    }

    changeSelectedBankAccountsIds(selectedBankAccountsIds: number[], saveInCache = true) {
        if (selectedBankAccountsIds) {
            this.changeState({
                selectedBankAccountIds: selectedBankAccountsIds
            }, saveInCache);
        }
    }

    changeSelectedBusinessEntities(selectedBusinessEntitiesIds: number[], saveInCache = true) {
        if (selectedBusinessEntitiesIds) {
            this.changeState({
                selectedBusinessEntitiesIds: selectedBusinessEntitiesIds
            }, saveInCache);
        }
    }

    changeBankAccountTypes(types: string[]) {
        this._selectedBankAccountTypes.next(types);
    }

    changeSearchString(searchValue: string) {
        this.searchValue.next(searchValue);
    }

    // getPosibleSelectedBankAccountsIds(bankAccounts: BankAccountDto[], activeStatus: boolean, selectedBusinessEntities: number[], selectedType: string): number[] {
    //     return bankAccounts.filter(account => {
    //         return (account.isActive || account.isActive === null) &&
    //                (!selectedBusinessEntities.length || selectedBusinessEntities.indexOf(account.businessEntityId) !== -1) &&
    //                (selectedType === this.allAccountTypesFilter || account.typeName === selectedType);
    //     }).map(account => account.id);
    // }

    filterDataSource(syncAccounts: SyncAccountBankDto[], businessEntitiesIds: number[], selectedAccountsIds: number[], visibleBankAccountsIds: number[], searchValue: string, statuses = null): SyncAccountBankDto[] {
        let result: SyncAccountBankDto[] = [];
        visibleBankAccountsIds = !visibleBankAccountsIds || !selectedAccountsIds || selectedAccountsIds.length === 0 ? [] : visibleBankAccountsIds;

        syncAccounts.forEach((syncAccount: SyncAccountBankDto) => {
            const isSyncAccountNameMatchesTheSearch = !searchValue || syncAccount.name.toLowerCase().indexOf(searchValue) >= 0;
            /** If business entities hasn't been chosen and search is among all business entities */
            if ((!businessEntitiesIds || !businessEntitiesIds.length) && (!syncAccount.bankAccounts || !syncAccount.bankAccounts.length)) {
                if (isSyncAccountNameMatchesTheSearch) {
                    let syncAccountClone = _.clone(syncAccount);
                    syncAccountClone['selected'] = false;
                    result.push(syncAccountClone);
                }
            } else {
                let selectedBankAccountCount = 0;
                let bankAccounts: BankAccountDto[] = [];
                syncAccount.bankAccounts.forEach(bankAccount => {
                    const isBankAccountMatchesTheSearch = isSyncAccountNameMatchesTheSearch
                        || bankAccount.accountName.toLowerCase().indexOf(searchValue) >= 0
                        || bankAccount.accountNumber.toLowerCase().indexOf(searchValue) >= 0;
                    if (isBankAccountMatchesTheSearch && (!businessEntitiesIds.length || (bankAccount.businessEntityId && _.contains(businessEntitiesIds, bankAccount.businessEntityId)))
                        && this.bankAccountMatchTheStatuses(bankAccount, statuses)
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

    private bankAccountMatchTheStatuses(bankAccount: BankAccountDto, statuses: BankAccountStatus[]) {
        return !statuses || !statuses.length
            || bankAccount.isActive === true && statuses.find((status: BankAccountStatus) => status === BankAccountStatus.Active) !== undefined
            || bankAccount.isActive === false && statuses.find((status: BankAccountStatus) => status === BankAccountStatus.Disabled) !== undefined;
    }

    changeStatusesFilter(value: BankAccountStatus[], saveInCache = false) {
        if (this.selectedStatuses.value !== value) {
            this.changeState({
                statuses: value,
                selectedBankAccountIds: null
            }, saveInCache);
            this.selectedStatuses.next(value);
        }
    }

    setBankAccountsFilter(filters, syncAccounts, emitFilterChange = false) {
        let accountFilter: FilterModel = _.find(filters, function (f: FilterModel) { return f.caption.toLowerCase() === 'account'; });
        accountFilter = this.changeAndGetBankAccountFilter(accountFilter, this.state, syncAccounts);
        emitFilterChange && this._filtersService.change(accountFilter);
        this.applyFilter();
    }

    changeAndGetBankAccountFilter(accountFilter: FilterModel, data: BankAccountsState, initialDataSource: SyncAccountBankDto[]) {
        let accountFilterModel = <any>accountFilter.items.element;
        if (ArrayHelper.dataChanged(initialDataSource, accountFilterModel.dataSource)) {
            accountFilterModel.dataSource = initialDataSource;
        }
        if (data.selectedBankAccountIds) {
            accountFilter.items['element'].setValue(data.selectedBankAccountIds, accountFilter);
        } else {
            accountFilter.items['element'].setValue([], accountFilter);
        }
        accountFilter.updateCaptions();
        return accountFilter;
    }
}
