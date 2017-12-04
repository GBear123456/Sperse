import { Injectable } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { Subject } from 'rxjs/Subject';
import { FilterModel } from './models/filter.model';
import * as _ from 'underscore';

@Injectable()
export class FiltersService {
    private filters: FilterModel[];
    private subjectFilters: Subject<FilterModel[]>;
    private subjectFilter: Subject<FilterModel>;

    private subscribers: Array<Subscription> = [];

    public enabled = false;
    public localizationSourceName: string;
    public hasFilterSelected = false;

    constructor() {
        this.subjectFilters = new Subject<FilterModel[]>();
        this.subjectFilter = new Subject<FilterModel>();
    }

    setup(filters: FilterModel[], initialValues?: any) {
        this.subjectFilters.next(this.filters = filters);
        if (initialValues && initialValues.filters) {
            let initFilters = JSON.parse(decodeURIComponent(initialValues.filters));
            filters.forEach((filter, i, arr) => {
                if (initFilters[filter.caption]) {
                    let props = Object.keys(initFilters[filter.caption]);
                    props.forEach(val => {
                        if (filter.items[val].setValue)
                            filter.items[val].setValue(initFilters[filter.caption][val], filter);
                        else
                            filter.items[val] = initFilters[filter.caption][val];
                    });
                }
            });
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
        this.enabled = !this.enabled;
    }

    checkIfAnySelected() {
        this.hasFilterSelected =
            _.any(this.filters, (x) => {
                if (x.items) {
                    let filterIsSet = false;
                    _.forEach(x.items, y => {
                        if ((y.value && !_.isArray(y.value)) || (y.value && y.value.length))
                            filterIsSet = true;
                    });
                    return filterIsSet;
                }

                return false;
            });
    }
}
