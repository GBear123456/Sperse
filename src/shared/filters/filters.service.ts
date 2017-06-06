import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Subject';

@Injectable()
export class FiltersService {
	private filters: Subject<Object[]>;
	private filter: Subject<Object>;

	constructor() {
		this.filters = new Subject<Object[]>();
		this.filter = new Subject<Object>();
	}

	setup(filters: Object[]) {
		this.filters.next(filters);
	}	

	update(callback: (filters: Object[]) => any) {
		this.filters.asObservable().subscribe(callback);
	}

	change(filter: Object) {
		this.filter.next(filter);
	}

	apply(callback: (filters: Object) => any) {
		this.filter.asObservable().subscribe(callback);
	}
}