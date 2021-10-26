/** Core imports */
import { Injectable } from '@angular/core';

/** Third party imports */
import { Subscription, Subject, BehaviorSubject, Observable } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';
import * as _ from 'underscore';
import capitalize from 'underscore.string/capitalize';
import each from 'lodash/each';

/** Application imports */
import { FilterModel } from './models/filter.model';
import { FilterHelpers as CrmFilterHelpers } from '@app/crm/shared/helpers/filter.helper';
import { FilterHelpers as CfoFilterHelpers } from '@app/cfo/shared/helpers/filter.helper';
import { FilterHelpers as PfmFilterHelpers } from '@app/pfm/shared/helpers/filter.helper';
import { FilterItemModel } from '@shared/filters/models/filter-item.model';
import { ContactGroup, ContactStatus } from '../AppEnums';
import { FilterMultilineInputModel } from '@shared/filters/multiline-input/filter-multiline-input.model';
import { ServerCacheService } from '@shared/common/server-cache-service/server-cache.service';
import { AsyncFilter } from '@shared/filters/models/async-filter.model';

@Injectable()
export class FiltersService {
    private filters: FilterModel[];
    private subjectFilterToggle: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    private subjectFixedToggle: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    fixedToggle$: Observable<boolean> = this.subjectFixedToggle.asObservable().pipe(
        distinctUntilChanged()
    );
    private subjectFilters: Subject<FilterModel[]> = new Subject<FilterModel[]>();
    private filtersChanged: Subject<FilterModel[]> = new Subject<FilterModel[]>();
    filtersChanged$: Observable<FilterModel[]> = this.filtersChanged.asObservable();
    private subscribers: Array<Subscription> = [];
    private disableTimeout: any;

    public hasFilterSelected = false;
    get enabled(): boolean {
        return this.subjectFilterToggle.getValue();
    }
    set enabled(value: boolean) {
        this.subjectFilterToggle.next(value);
    }
    get fixed(): boolean {
        return this.subjectFixedToggle.getValue();
    }
    set fixed(value: boolean) {
        this.subjectFixedToggle.next(value);
    }

    filterFixed$ = this.subjectFixedToggle.asObservable();
    filterToggle$ = this.subjectFilterToggle.asObservable();
    filtersValues$: Observable<any> = this.filtersChanged$.pipe(
        map(() => {
            let filtersValues = {};
            this.filters.forEach((filterModel: FilterModel) => {
                filtersValues = {
                    ...filtersValues,
                    ...filterModel.getValues()
                };
            });
            return filtersValues;
        })
    );

    static filterByCategory(filter: FilterModel) {
        return PfmFilterHelpers.filterByCategory(filter);
    }

    static filterByRank(filter: FilterModel) {
        return CrmFilterHelpers.filterByRating(filter);
    }

    static filterByTrafficSource() {
        return PfmFilterHelpers.filterByTrafficSource();
    }

    static filterByStates(filter: FilterModel) {
        return CrmFilterHelpers.filterByStates(filter);
    }

    static filterByStatus(filter: FilterModel) {
        return CrmFilterHelpers.filterBySetOfValues(filter);
    }

    static filterByTier(filter: FilterModel) {
        return CrmFilterHelpers.filterBySetOfValues(filter);
    }

    static filterBySubscription(filter: FilterModel) {
        return CrmFilterHelpers.filterBySetOfValues(filter);
    }

    static filterBySubscriptionStatus(filter: FilterModel) {
        return null;
    }

    static filterByType(filter: FilterModel) {
        return CrmFilterHelpers.filterBySetOfValues(filter);
    }

    static filterByAssignedUser(filter: FilterModel) {
        return CrmFilterHelpers.filterBySetOfValues(filter);
    }

    static filterBySourceOrganizationUnitId(filter: FilterModel) {
        return CrmFilterHelpers.filterBySetOfValues(filter);
    }

    static filterBySource(filter: FilterModel) {
        return CrmFilterHelpers.filterBySource(filter);
    }

    static filterByDepartment(filter: FilterModel) {
        return CrmFilterHelpers.filterBySetOfValues(filter);
    }

    static filterByCashflowTypeId(filter: FilterModel) {
        return CrmFilterHelpers.filterBySetOfValues(filter);
    }

    static filterByList(filter: FilterModel) {
        return CrmFilterHelpers.filterBySetOfValues(filter);
    }

    static filterByTag(filter: FilterModel) {
        return CrmFilterHelpers.filterBySetOfValues(filter);
    }

    static filterByRating(filter: FilterModel) {
        return CrmFilterHelpers.filterByRating(filter);
    }

    static filterByStar(filter: FilterModel) {
        return CrmFilterHelpers.filterBySetOfValues(filter);
    }

    static filterByStages(filter: FilterModel) {
        let data = {};
        if (filter.items.element) {
            let filterData = CrmFilterHelpers.ParsePipelineIds(filter.items.element.value);
            data = {
                or: filterData
            };
        }

        return data;
    }

    static filterByNumber(filter, filterValueModifier?: (value) => number) {   
        let data = {};
        data[filter.field] = {};
        each(filter.items, (item: FilterItemModel, key) => {
            if (item && typeof(item.value) == 'number') 
                data[filter.field][filter.operator[key]] = +(
                    filterValueModifier
                    ? filterValueModifier(item.value)
                    : item.value
                );
        });
        return data;
    }

    static filterByAmount(filter, filterValueModifier?: (value) => number) {
        return FiltersService.filterByNumber(filter, filterValueModifier);
    }

    static filterByFee(filter) {
        return FiltersService.filterByAmount(filter);
    }

    static filterByCommission(filter) {
        return FiltersService.filterByAmount(filter);
    }

    static filterByProductAmount(filter) {
        return FiltersService.filterByAmount(filter);
    }

    static filterByCommissionRate(filter) {
        return FiltersService.filterByAmount(filter, (value) => 
            isNaN(value) ? value : (value / 100).toFixed(4)
        );
    }

    static filterByTotalAmount(filter) {
        return FiltersService.filterByAmount(filter);
    }

    static filterByOrderStages(filter: FilterModel) {
        let data = {};
        if (filter.items.element) {
            let filterData = CrmFilterHelpers.ParsePipelineIds(filter.items.element.value);
            data = {
                or: filterData
            };
        }

        return data;
    }

    static filterByClassified(filter: FilterModel) {
        let isYes = filter.items.yes.value;
        let isNo = filter.items.no.value;

        if (isYes ^ isNo) {
            let obj = {};
            obj[filter.field] = {};
            if (isYes) {
                obj[filter.field]['ne'] = null;
            } else {
                obj[filter.field] = null;
            }
            return obj;
        }
    }

    static filterByAccount(filter: FilterModel) {
        let data = {};
        if (filter.items.element) {
            let bankAccountIds = [];
            filter.items.element.dataSource.forEach((syncAccount) => {
                syncAccount.bankAccounts.forEach((bankAccount) => {
                    if (bankAccount['selected']) {
                        bankAccountIds.push(bankAccount.id);
                    }
                });
            });

            if (bankAccountIds.length) {
                //Should be like this, but IN is not currently implemented by odata-query lib >:-(. https://github.com/techniq/odata-query/issues/22
                //data = {
                //    BankAccountId: {
                //        in: bankAccountIds
                //    }
                //};

                data = `BankAccountId in (${bankAccountIds.join(',')})`;
            }
        }

        return data;
    }

    static filterByTransactionType(filter: FilterModel) {
        return CfoFilterHelpers.filterByExcludeElement(filter);
    }

    static filterByClientGroupId() {
        return CrmFilterHelpers.filterByClientGroupId();
    }

    static filterByPartnerGroupId() {
        return CrmFilterHelpers.filterByPartnerGroupId();
    }

    static filterByParentId() {
        return CrmFilterHelpers.filterByParentId();
    }

    static getCustomerFilters(): any[] {
        return [
            {
                'or': [
                    { 'StatusId': { 'eq': ContactStatus.Active }},
                    { 'StatusId': { 'eq': ContactStatus.Prospective }}
                ]
            },
            { 'ParentId': { 'eq': null }}
        ];
    }

    constructor(
        private serverCacheService: ServerCacheService
    ) {}

    filterByMultiline(filter: FilterModel): string[] | {[uuidName: string]: AsyncFilter} | 'cancelled' {
        let data: string[] | {[uuidName: string]: AsyncFilter} | 'cancelled' = [];
        let element = filter.items.element as FilterMultilineInputModel;
        if (element) {
            let valuesArray: string[] = element.valuesArray;
            if (valuesArray && valuesArray.length) {
                let inExpressions = [];
                const isLongFilter = valuesArray.length > 20;
                let normalizedValues = [];
                valuesArray.forEach((value: string) => {
                    let normalizedValue = value;
                    if (element.normalize) {
                        normalizedValue = element.normalize(value);
                    }
                    if (normalizedValue) {
                        if (!isLongFilter) {
                            inExpressions.push(`'${normalizedValue.replace(/'/g, "''")}'`);
                        }
                        normalizedValues.push(normalizedValue);
                    }
                });
                if (isLongFilter) {
                    data = {
                        [ServerCacheService.filterNamesToCacheIdNames[filter.caption]]: new AsyncFilter(
                            this.serverCacheService.getServerCacheId(normalizedValues),
                            valuesArray.length
                        )
                    }
                } else {
                    data = inExpressions.length
                        ? [`${filter.field} in (${encodeURIComponent(inExpressions.join(','))})`]
                        : 'cancelled';
                }
            }
        }

        return data;
    }

    setup(filters: FilterModel[], initialValues?: any, applyFilterImmediately = true): boolean {
        this.subjectFilters.next(this.filters = filters);
        if (initialValues && initialValues.filters) {
            let initFilters = JSON.parse(decodeURIComponent(initialValues.filters));
            filters && filters.forEach((filter) => {
                filter.clearFilterItems();
                if (initFilters[filter.caption]) {
                    let props = Object.keys(initFilters[filter.caption]);
                    props.forEach(val => {
                        if (filter.items[val].dispatchValue)
                            filter.items[val].dispatchValue(initFilters[filter.caption][val], filter);
                        else
                            filter.items[val] = initFilters[filter.caption][val];
                    });
                }
            });
            if (applyFilterImmediately)
                this.change([<FilterModel>{}]);
        }
        return this.checkIfAnySelected();
    }

    update(callback: (filters: FilterModel[]) => any) {
        this.subjectFilters.asObservable().subscribe(callback);
    }

    change(filters: FilterModel[]) {
        this.checkIfAnySelected();
        this.filtersChanged.next(filters);
    }

    apply(callback: (filters: FilterModel[]) => any, keepAlways: boolean = false) {
        let sub = this.filtersChanged$.subscribe(callback);
        if (!keepAlways)
            this.subscribers.push(sub);
    }

    clearAllFilters() {
        this.hasFilterSelected = false;
        this.filters.forEach(
            (filter: FilterModel) => filter.clearFilterItems()
        );
        this.change(null);
    }

    unsubscribe() {
        this.hasFilterSelected = false;
        this.subscribers.map((sub) => {
            return void (sub.unsubscribe());
        });
        this.subscribers.length = 0;
    }

    toggle() {
        this[this.enabled ? 'disable' : 'enable']();
    }

    enable() {
        this.preventDisable();
        this.enabled = true;
    }

    disable(callback: () => void = null) {
        this.preventDisable();
        this.disableTimeout = setTimeout(() => {
            callback && callback();
            this.fixed = false;
            this.enabled = false;
        }, 100);
    }

    preventDisable() {
        clearTimeout(this.disableTimeout);
        this.disableTimeout = null;
    }

    checkIfAnySelected(): boolean {
        this.hasFilterSelected = false;
        _.forEach(this.filters, (x) => {
            if (x.items) {
                x.isSelected = !x.hidden && _.any(x.items, y => {
                    if (y && y.value && (!_.isArray(y.value)
                        || (y.value.length && y.value[0].hasOwnProperty && y.value[0].hasOwnProperty('value')
                              ? y.value.some(val => val.value)
                              : y.value.length
                        )
                    ))
                        return this.hasFilterSelected = true;
                    return false;
                });
            }
        });
        return this.hasFilterSelected;
    }

    getCheckCustom = (filter: FilterModel) => {
        let filterMethod = filter.filterMethod || FiltersService['filterBy' + capitalize(filter.caption)];
        if (filterMethod)
            return filterMethod.call(this, filter);
    }
}