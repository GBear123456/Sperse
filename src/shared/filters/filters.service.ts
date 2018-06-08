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
    public  subjectFilterDisable: Subject<undefined>;
    private subscribers: Array<Subscription> = [];
    private disableTimeout: any;

    public enabled = false;
    public fixed = false;
    public localizationSourceName: string;
    public hasFilterSelected = false;

    constructor() {
        this.subjectFilters = new Subject<FilterModel[]>();
        this.subjectFilter = new Subject<FilterModel>();
        this.subjectFilterDisable = new Subject();
    }

    setup(filters: FilterModel[], initialValues?: any, applyFilterImmediately = true) {
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
            this.enabled = false;
            this.fixed = false;
            this.subjectFilterDisable.next();
        }, 300);
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
