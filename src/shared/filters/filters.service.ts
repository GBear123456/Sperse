/** Core imports */
import { Injectable } from '@angular/core';

/** Third party imports */
import { Subscription, Subject, BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import * as _ from 'underscore';
import capitalize from 'underscore.string/capitalize';
import each from 'lodash/each';

/** Application imports */
import { FilterModel } from './models/filter.model';
import { FilterHelpers as CrmFilterHelpers } from '@app/crm/shared/helpers/filter.helper';
import { FilterHelpers as CfoFilterHelpers } from '@app/cfo/shared/helpers/filter.helper';
import { FilterItemModel } from '@shared/filters/models/filter-item.model';

@Injectable()
export class FiltersService {
    private filters: FilterModel[];
    private subjectFilterToggle: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    private subjectFixedToggle: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    private subjectFilters: Subject<FilterModel[]> = new Subject<FilterModel[]>();
    private subjectFilter: Subject<FilterModel> = new Subject<FilterModel>();
    filterChanged$: Observable<FilterModel> = this.subjectFilter.asObservable();
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
    filtersValues$: Observable<any> = this.subjectFilter.pipe(
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

    static filterByStates(filter: FilterModel) {
        return CrmFilterHelpers.filterByStates(filter);
    }

    static filterByStatus(filter: FilterModel) {
        return CrmFilterHelpers.filterBySetOfValues(filter);
    }

    static filterByType(filter: FilterModel) {
        return CrmFilterHelpers.filterBySetOfValues(filter);
    }

    static filterByAssignedUser(filter: FilterModel) {
        return CrmFilterHelpers.filterBySetOfValues(filter);
    }

    static filterByOrganizationUnitId(filter: FilterModel) {
        return CrmFilterHelpers.filterBySetOfValues(filter);
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

    static filterByAmount(filter) {
        let data = {};
        data[filter.field] = {};
        each(filter.items, (item: FilterItemModel, key) => {
            item && item.value && (data[filter.field][filter.operator[key]] = +item.value);
        });
        return data;
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

    setup(filters: FilterModel[], initialValues?: any, applyFilterImmediately = true) {
        this.subjectFilters.next(this.filters = filters);
        if (initialValues && initialValues.filters) {
            let initFilters = JSON.parse(decodeURIComponent(initialValues.filters));
            filters.forEach((filter) => {
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
                this.change(<FilterModel>{});
        }
        this.checkIfAnySelected();
    }

    update(callback: (filters: FilterModel[]) => any) {
        this.subjectFilters.asObservable().subscribe(callback);
    }

    change(filter: FilterModel) {
        this.checkIfAnySelected();
        this.subjectFilter.next(filter);
    }

    apply(callback: (filter: FilterModel) => any, keepAlways: boolean = false) {
        let sub = this.subjectFilter.asObservable().subscribe(callback);
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

    checkIfAnySelected() {
        this.hasFilterSelected = false;
        _.forEach(this.filters, (x) => {
            if (x.items) {
                x.isSelected = _.any(x.items, y => {
                    if ((y.value && !_.isArray(y.value)) || (y.value && y.value.length))
                        return this.hasFilterSelected = true;
                    return false;
                });
            }
        });
    }

    getCheckCustom = (filter: FilterModel) => {
        let filterMethod = FiltersService['filterBy' + capitalize(filter.caption)];
        if (filterMethod)
            return filterMethod.call(this, filter);
    }

}
