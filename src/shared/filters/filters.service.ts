/** Core imports */
import { Injectable } from '@angular/core';

/** Third party imports */
import { Subscription, Subject, BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import * as _ from 'underscore';

/** Application imports */
import { FilterModel } from './models/filter.model';

@Injectable()
export class FiltersService {
    private filters: FilterModel[];
    private subjectFilterToggle: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    private subjectFixedToggle: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    private subjectFilters: Subject<FilterModel[]> = new Subject<FilterModel[]>();
    private subjectFilter: Subject<FilterModel> = new Subject<FilterModel>();
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

    setup(filters: FilterModel[], initialValues?: any, applyFilterImmediately = true) {
        this.subjectFilters.next(this.filters = filters);
        if (initialValues && initialValues.filters) {
            let initFilters = JSON.parse(decodeURIComponent(initialValues.filters));
            filters.forEach((filter) => {
                filter.clearFilterItems();
                if (initFilters[filter.caption]) {
                    let props = Object.keys(initFilters[filter.caption]);
                    props.forEach(val => {
                        if (filter.items[val].setValue) {
                            filter.items[val].setValue(initFilters[filter.caption][val], filter);
                        } else {
                            filter.items[val] = initFilters[filter.caption][val];
                        }
                    });
                }
            });
            if (applyFilterImmediately)
                this.change(<FilterModel>{});
        }
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
}
