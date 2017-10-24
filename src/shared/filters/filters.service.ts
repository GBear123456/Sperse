import { Injectable } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { Subject } from 'rxjs/Subject';
import { FilterModel } from './filter.model';

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

	setup(filters: FilterModel[]) {
		this.filters.next(filters);
	}	

	update(callback: (filters: FilterModel[]) => any) {
    this.filters.asObservable().subscribe(callback);
	}

	change(filter: FilterModel) {
		this.filter.next(filter);
	}

	apply(callback: (filter: FilterModel) => any) {
    this.subscribers.push(
  		this.filter.asObservable().subscribe(callback)
    );
	}

  unsubscribe() {
    this.subscribers.map((sub) => {
      return void(sub.unsubscribe());
    });
    this.subscribers.length = 0;
  }
}
