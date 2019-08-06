/** Core imports */
import { Injectable } from '@angular/core';

/** Third party imports */
import { Observable, BehaviorSubject, ReplaySubject, of, combineLatest, forkJoin } from 'rxjs';
import {
    debounceTime,
    distinctUntilChanged,
    first,
    finalize,
    map,
    refCount,
    pairwise,
    publishReplay,
    withLatestFrom,
    switchMap,
    tap
} from 'rxjs/operators';
import { CacheService } from 'ng2-cache-service';
import * as _ from 'underscore';
import values from 'lodash/values';
import difference from 'lodash/difference';
import orderBy from 'lodash/orderBy';

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
        selectedBusinessEntitiesIds: [],
        selectedBankAccountTypes: []
    };
    tempState: BankAccountsState;
    filteredBankAccounts$: Observable<BankAccountDto[]>;
    filteredBankAccountsIds: number[];
    filteredBankAccountsIds$: Observable<number[]>;
    filteredBankAccountsStatus$: Observable<string>;
    selectedBankAccounts$: Observable<BankAccountDto[]>;
    selectedBankAccountsIds$: Observable<number[]>;
    _syncAccountsState: BehaviorSubject<BankAccountsState> = new BehaviorSubject(this.state);
    syncAccountsState$: Observable<BankAccountsState> = this._syncAccountsState.asObservable();
    accountsDataTotalNetWorth$: Observable<number>;
    accountsDataTotalNetWorthWithApply$: Observable<number>;
    allSyncAccountAreSelected$: Observable<boolean | undefined>;
    syncAccountsAmount$: Observable<string>;
    accountsAmount$: Observable<string>;
    accountsAmountWithApply$: Observable<string>;
    existingBankAccountsTypes$: Observable<BankAccountType[]>;
    existingBankAccountsTypesWithFilteredCounts$: Observable<BankAccountType[]>;
    private _selectedBankAccountTypes: BehaviorSubject<string[]> = new BehaviorSubject([]);
    selectedBankAccountTypes$: Observable<string[]> = this._selectedBankAccountTypes.asObservable();

    private _applyFilter = new BehaviorSubject<Boolean>(false);
    applyFilter$ = this._applyFilter.asObservable();
    _syncAccounts: ReplaySubject<SyncAccountBankDto[]> = new ReplaySubject(1);
    _businessEntities: BehaviorSubject<BusinessEntityDto[]> = new BehaviorSubject([]);
    syncAccounts$: Observable<SyncAccountBankDto[]>;
    bankAccountsIds$: Observable<number[]>;
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
    selectDefaultBusinessEntity = false;

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
        this.businessEntities$ = this._businessEntities.asObservable().pipe(
            map((businessEntities: BusinessEntityDto[]) => {
                if (this.selectDefaultBusinessEntity) {
                    /** Get default business entities ids and select it */
                    const defaultBusinessEntitiesIds = businessEntities
                        .filter((businessEntity: BusinessEntityDto) => businessEntity.isDefault)
                        .map((businessEntity: BusinessEntityDto) => businessEntity.id);
                    if (defaultBusinessEntitiesIds && defaultBusinessEntitiesIds.length) {
                        this.changeSelectedBusinessEntities(defaultBusinessEntitiesIds);
                    }
                    this.selectDefaultBusinessEntity = false;
                }
                return this.sortBusinessEntities(businessEntities);
            }),
            distinctUntilChanged(this.arrayDistinct)
        );
        this.bankAccountsIds$ = this.syncAccounts$
            .pipe(
                map(syncAccounts => {
                    let bankAccountsIds = [];
                    syncAccounts.forEach((syncAccount: SyncAccountBankDto) => {
                        syncAccount.bankAccounts.forEach((bankAccount: BankAccountDto) => {
                            bankAccountsIds.push(bankAccount.id);
                        });
                    });
                    return bankAccountsIds;
                }),
                distinctUntilChanged(this.arrayDistinct)
            );
        this.bankAccountsIds$.pipe(
            pairwise(),
            map(([prevBankAccountsIds, nextBankAccountsIds]) => {
                /** Select newly added bank accounts */
                return this.changeSelectedBankAccountsIds([
                    ...this.state.selectedBankAccountIds,
                    ...difference(nextBankAccountsIds, prevBankAccountsIds)
                ]);
            }),
            switchMap(() => this.filteredSyncAccounts$),
        ).subscribe(() => {
            this.applyFilter();
        });
        this.businessEntitiesAmount$ = this.businessEntities$.pipe(
            map(businessEntities => businessEntities.length),
            distinctUntilChanged()
        );

        this.selectedBusinessEntities$ =
            combineLatest(
                this.businessEntities$,
                this.syncAccountsState$
            ).pipe(
                map(([businessEntities, state]) => {
                    return businessEntities.filter(businessEntity => {
                        return state.selectedBusinessEntitiesIds.indexOf(businessEntity.id) !== -1;
                    });
                }),
                distinctUntilChanged((oldEntities, newEntities) => !ArrayHelper.dataChanged(oldEntities, newEntities))
            );

        this.selectedBusinessEntitiesIds$ = this.selectedBusinessEntities$.pipe(
            map(businessEntities => businessEntities.reduce((entitiesIds, entity) => {
                return entitiesIds.concat(entity.id);
            }, [])),
            distinctUntilChanged((oldIds, newIds) => !ArrayHelper.dataChanged(oldIds, newIds))
        );

        /**
         * Get array of unique accounts types
         * @type {Observable<string[]>}
         */
        this.existingBankAccountsTypes$ = this.getBankAccountsTypes(this.syncAccounts$);

        this.filteredSyncAccounts$ = this.getFilteredSyncAccounts(
            this.syncAccounts$,
            this.selectedBankAccountTypes$,
            this.existingBankAccountsTypes$,
            this.syncAccountsState$,
            this.searchValue$
        );

        this.distinctUntilChangedFilteredSyncAccounts$ = this.filteredSyncAccounts$
            .pipe(distinctUntilChanged(this.accountsChanged));

        this.filteredSyncAccountsWithApply$ =
            this.filteredSyncAccounts$.pipe(
                first(),
                switchMap(() => this.applyFilter$),
                withLatestFrom(this.filteredSyncAccounts$, (applyForLink, filteredAccounts) => {
                    this.changeSelectedBankAccountsIds(
                        filteredAccounts.reduce((result, account) => {
                            if (account.bankAccounts.length) {
                                if (!applyForLink && this.acceptFilterOnlyOnApply &&
                                    !this.state.selectedBankAccountIds.length
                                ) {
                                    account['selected'] = true;
                                    account.bankAccounts.forEach(bank => {
                                        bank['selected'] = true;
                                        result.push(bank.id);
                                    });
                                } else 
                                    result = result.concat(account.bankAccounts.filter(
                                        item => item['selected']).map(item => item.id));                              
                            }
                            return result;
                        }, [])
                    );
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

        /** Get types counts depends on filtered sync account (but exclude filtering of selected types to show count for types independently of
         *  type filter) */
        this.existingBankAccountsTypesWithFilteredCounts$ = this.getBankAccountsTypes(this.getFilteredSyncAccounts(
            this.syncAccounts$,
            of([]),
            this.existingBankAccountsTypes$,
            this.syncAccountsState$,
            this.searchValue$
        )).pipe(
            withLatestFrom(this.existingBankAccountsTypes$),
            map(([filteredAccountTypes, allAccountTypes]: [BankAccountType[], BankAccountType[]]) => {
                let result = [];
                allAccountTypes.forEach((type: BankAccountType) => {
                    const accountTypeInFiltered = filteredAccountTypes.find((t: BankAccountType) => t.id === type.id);
                    if (accountTypeInFiltered) {
                        result.push(accountTypeInFiltered);
                    } else {
                        result.push({
                            id: type.id,
                            name: type.name,
                            count: 0
                        });
                    }
                });
                return result;
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
            map(this.getSelectedBankAccounts),
            distinctUntilChanged(this.arrayDistinct)
        );

        this.selectedBankAccountsIds$ = this.selectedBankAccounts$.pipe(
            map(bankAccounts => {
                return bankAccounts.map(account => account.id);
            }),
            distinctUntilChanged(this.arrayDistinct)
        );

        this.accountsDataTotalNetWorth$ = this.getAccountsTotalNetWorth(this.filteredSyncAccounts$);
        this.accountsDataTotalNetWorthWithApply$ = this.getAccountsTotalNetWorth(this.filteredSyncAccountsWithApply$);

        this.allSyncAccountAreSelected$ = this.filteredSyncAccounts$.pipe(
            map((syncAccounts: SyncAccountBankDto[]) => {
                let selectedSyncAccountsNumber = 0;
                let syncAccountWithoutBankAccountsNumber = 0;
                syncAccounts.forEach((syncAccount: SyncAccountBankDto) => {
                    if (!syncAccount.bankAccounts.length) {
                        syncAccountWithoutBankAccountsNumber++;
                    } else if (syncAccount['selected'] !== false) {
                        selectedSyncAccountsNumber++;
                    }
                });
                /** If there are no selected accounts - return false, else - check the sum of selected and empty accounts and if
                 *  it's the same as total - return true
                 */
                return selectedSyncAccountsNumber
                       ? (selectedSyncAccountsNumber + syncAccountWithoutBankAccountsNumber === syncAccounts.length ? true : undefined)
                       : false;
            }),
            distinctUntilChanged()
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

        this.accountsAmount$ = this.getFilteredBankAccounts(this.filteredSyncAccounts$).pipe(
            map(this.getBankAccountsAmount),
            distinctUntilChanged()
        );

        this.accountsAmountWithApply$ = this.getFilteredBankAccounts(this.filteredSyncAccountsWithApply$).pipe(
            map(this.getBankAccountsAmount),
            distinctUntilChanged()
        );

    }

    loadState(applyFilter = true) {
        const cachedState = this.cacheService.get(this.bankAccountsCacheKey);
        /** If there are no cache (user is logging the first time) and it is cfo portal */
        if (!cachedState && this.cfoService.hasStaticInstance) {
            this.selectDefaultBusinessEntity = true;
        }

        /** Get filter data from cache and apply it to update all accounts */
        this.state = {...this.state, ...cachedState};
        this._selectedBankAccountTypes.next(this.state.selectedBankAccountTypes);
        this.selectedStatuses.next(this.state.statuses);
        this._syncAccountsState.next(this.state);

        if (this.acceptFilterOnlyOnApply && (!this.state.selectedBankAccountIds || !this.state.selectedBankAccountIds.length)) {
            this.changeSelectedBankAccountsIds(this.filteredBankAccountsIds);
            if (applyFilter) {
                this.applyFilter();
            }
        }
    }

    sortBusinessEntities(list) {
        list.forEach(item => {
            item['isSelected'] = this.state.selectedBusinessEntitiesIds.indexOf(item.id) >= 0;
        });
        return orderBy(list, ['isSelected', 'hasChildren', 'name'], ['desc', 'desc', 'asc']);
    }

    load(acceptFilterOnlyOnApply = true, applyFilter = true) {
        /** Change accept value */
        this.acceptFilterOnlyOnApply = acceptFilterOnlyOnApply;

        this.loadState(applyFilter);

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
                if (applyFilter) {
                    this.applyFilter();
                }
            });
        });

        return combinedRequest;
    }

    private getFilteredSyncAccounts(
        syncAccounts$: Observable<SyncAccountBankDto[]>,
        selectedBankAccountTypes$: Observable<string[]>,
        existingBankAccountsTypes$: Observable<BankAccountType[]>,
        syncAccountsState$: Observable<BankAccountsState>,
        searchValue$: Observable<string>
    ) {
        return combineLatest(
            this.getFilteredSyncAccountsWithType(
                syncAccounts$,
                selectedBankAccountTypes$,
                existingBankAccountsTypes$
            ),
            syncAccountsState$,
            searchValue$
        ).pipe(
            map(([syncAccounts, state, searchValue]) => {
                return this.filterDataSource(
                    syncAccounts,
                    state.selectedBusinessEntitiesIds,
                    state.selectedBankAccountIds,
                    state.visibleBankAccountIds,
                    searchValue,
                    state.statuses
                );
            }),
            distinctUntilChanged(this.arrayDistinct)
        );
    }

    private getBankAccountsTypes(syncAccounts$: Observable<SyncAccountBankDto[]>): Observable<BankAccountType[]> {
        return syncAccounts$.pipe(
            /** Get all types names and counts */
            map((syncAccounts: SyncAccountBankDto[]) => {
                let types = {};
                syncAccounts.forEach((syncAccount: SyncAccountBankDto) => {
                     syncAccount.bankAccounts.forEach((bankAccount: BankAccountDto) => {
                         if (types[bankAccount.typeName]) {
                             types[bankAccount.typeName].count++;
                         } else {
                             const typeName = bankAccount.typeName || this.localizationService.l('NoType');
                             types[typeName] = {
                                 id: typeName,
                                 name: typeName,
                                 count: 1
                             };
                         }
                     });
                });
                return values(types);
            }),
            /** Sort types */
            map((types: BankAccountType[]) => types.sort(this.sortBankAccountsTypes)),
            distinctUntilChanged(this.arrayDistinct),
            tap(list => {
                if (!this.cacheService.get(this.bankAccountsCacheKey)) {
                    this._selectedBankAccountTypes.next(
                        list.filter(item => item.name != 'Bill.com' && item.name != 'Accounting').map(item => item.id)
                    );
                }
            })
        );
    }

    private getFilteredSyncAccountsWithType(
        syncAccounts$: Observable<SyncAccountBankDto[]>,
        selectedBankAccountsTypes$: Observable<string[]>,
        existingBankAccountsTypes$: Observable<BankAccountType[]>
    ): Observable<SyncAccountBankDto[]> {
        return combineLatest(
            syncAccounts$,
            selectedBankAccountsTypes$,
            existingBankAccountsTypes$
        ).pipe(
            map(([syncAccounts, selectedTypes, allTypes]) => {
                return this.filterByBankAccountTypes(syncAccounts, selectedTypes, allTypes);
            }),
            distinctUntilChanged(this.arrayDistinct)
        );
    }

    private getAccountsTotalBalance = bankAccounts => bankAccounts.reduce((sum, bankAccount) => {
        return sum + bankAccount.balance;
    }, 0)

    private getSelectedBankAccounts = (bankAccounts: any) => {
        return bankAccounts.filter(bankAccount => bankAccount.selected);
    }

    private getBankAccountsAmount(bankAccounts: BankAccountDto[]) {
        const selectedBankAccounts = bankAccounts.filter(bankAccount => bankAccount['selected']);
        return selectedBankAccounts.length === bankAccounts.length
            ? selectedBankAccounts.length.toString()
            : `${selectedBankAccounts.length} of ${bankAccounts.length}`;
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

    private getAccountsTotalNetWorth(syncAccounts$: Observable<SyncAccountBankDto[]>): Observable<number> {
        return this.getFilteredBankAccounts(syncAccounts$).pipe(
            map(this.getSelectedBankAccounts),
            map(this.getAccountsTotalBalance),
            distinctUntilChanged()
        );
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
        let tempFilter = { ...this.state, ...this.tempState, ...state };
        if (saveInCache) {
            this.saveStateInCache(tempFilter);
        } else {
            this.tempState = tempFilter;
        }
        if (state.hasOwnProperty('selectedBankAccountTypes')) {
            this._selectedBankAccountTypes.next(tempFilter.selectedBankAccountTypes);
        }
        if (state.hasOwnProperty('statuses')) {
            this.selectedStatuses.next(tempFilter.statuses);
        }
        if (saveInCache && state.hasOwnProperty('selectedBusinessEntitiesIds')) {
            this._businessEntities.next(this._businessEntities.getValue());
        }
        this._syncAccountsState.next(tempFilter);
    }

    resetState() {
        this.changeState(this.state, true);
    }

    clearTempState() {
        this.tempState = null;
    }

    applyFilter(applyForLink = false) {
        if (this.tempState) {
            this.saveStateInCache(this.tempState);
            this.clearTempState();
        }
        this._applyFilter.next(applyForLink);
    }

    private saveStateInCache(state: BankAccountsState) {
        this.state = state;
        this.cacheService.set(this.bankAccountsCacheKey, this.state);
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

    changeBankAccountTypes(types: string[], saveInCache = true) {
        if (types) {
            this.changeState(
                { selectedBankAccountTypes: types },
                saveInCache
            );
            this._selectedBankAccountTypes.next(types);
        }
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
            const isSyncAccountNameMatchesTheSearch = !searchValue || syncAccount.name && syncAccount.name.toLowerCase().indexOf(searchValue) >= 0;
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
                        || bankAccount.accountName && bankAccount.accountName.toLowerCase().indexOf(searchValue) >= 0
                        || bankAccount.accountNumber && bankAccount.accountNumber.toLowerCase().indexOf(searchValue) >= 0;
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
                statuses: value
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
