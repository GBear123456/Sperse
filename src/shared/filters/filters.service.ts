import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { FilterModel } from './filter.model';

@Injectable()
export class FiltersService {
	private filters: Subject<FilterModel[]>;
	private filter: Subject<FilterModel>;

	constructor() {
		this.filters = new Subject<FilterModel[]>();
		this.filter = new Subject<FilterModel>();
	}

	setup(filters: FilterModel[]) {
		this.filters.next(filters);
	}	

	update(callback: (filters: FilterModel[]) => any) {
		this.filters.asObservable().subscribe(callback);
	}

	change(filter: FilterModel) {
		this.filter.next(filter);
	}

	apply(callback: (filters: FilterModel) => any) {
		this.filter.asObservable().subscribe(callback);
	}
}