/** Core imports */
import { Injectable, Injector } from '@angular/core';

/** Third party imports */
import { ReplaySubject } from 'rxjs';

@Injectable()
export class PersonalFinanceLayoutService {
    private headerSubject: ReplaySubject<Object>;

    constructor(injector: Injector) {
        this.headerSubject = new ReplaySubject<Object>();
    }

    headerContentSubscribe(callback) {
        this.headerSubject.asObservable().subscribe(callback);
    }

    headerContentUpdate(component) {
        this.headerSubject.next(component);
    }
}
