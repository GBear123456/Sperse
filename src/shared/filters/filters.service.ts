import { Injectable } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { Subject } from 'rxjs/Subject';
import { FilterModel } from './models/filter.model';

@Injectable()
export class FiltersService {
    private filters: Subject<FilterModel[]>;
    private filter: Subject<FilterModel>;

    private subscribers: Array<Subscription> = [];

    public enabled: boolean = false;
    public localizationSourceName: string;

    constructor() {
        this.filters = new Subject<FilterModel[]>();
        this.filter = new Subject<FilterModel>();
    }

    setup(filters: FilterModel[], initialValues?: any) {
        if (initialValues && initialValues.filters) {
            let initFilters = JSON.parse(decodeURIComponent(initialValues.filters));
            filters.forEach((filter, i, arr) => {
                if (initFilters[filter.caption]) {
                    let props = Object.keys(initFilters[filter.caption]);
                    props.forEach( val => {
                        if (filter.items[val].setValue)
                            filter.items[val].setValue(initFilters[filter.caption][val], filter);
                        else
                            filter.items[val] = initFilters[filter.caption][val];
                    });
                }
            });
        }
        this.filters.next(filters);

        if (initialValues && initialValues.filters) {
            this.change(<FilterModel>{});
        }
    }

    update(callback: (filters: FilterModel[]) => any) {
        this.filters.asObservable().subscribe(callback);
    }

    change(filter: FilterModel) {
        this.filter.next(filter);
    }

    apply(callback: (filter: FilterModel) => any, keepAlways: boolean = false) {
        if (keepAlways)
            this.filter.asObservable().subscribe(callback)
        else
            this.subscribers.push(
                this.filter.asObservable().subscribe(callback)
            );
    }

    unsubscribe() {
        this.subscribers.map((sub) => {
            return void (sub.unsubscribe());
        });
        this.subscribers.length = 0;
    }
}
