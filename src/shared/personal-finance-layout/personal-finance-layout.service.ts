/** Core imports */
import { Injectable } from '@angular/core';

/** Third party imports */
import { ReplaySubject } from 'rxjs';

@Injectable()
export class PersonalFinanceLayoutService {
    private headerSubject: ReplaySubject<Object>;

    constructor() {
        this.headerSubject = new ReplaySubject<Object>(1);
    }

    headerContentSubscribe(callback) {
        this.headerSubject.asObservable().subscribe(callback);
    }

    headerContentUpdate(component) {
        this.headerSubject.next(component);
    }
}
