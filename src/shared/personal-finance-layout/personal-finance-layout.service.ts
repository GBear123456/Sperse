/** Core imports */
import { Injectable, Injector } from '@angular/core';

/** Third party imports */
import { Subject } from 'rxjs';

@Injectable()
export class PersonalFinanceLayoutService {
    private headerSubject: Subject<Object>;

    constructor(injector: Injector) {
        this.headerSubject = new Subject<Object>();
    }

    headerContentSubscribe(callback) {
        this.headerSubject.asObservable().subscribe(callback);
    }

    headerContentUpdate(component) {
        this.headerSubject.next(component);
    }
}
