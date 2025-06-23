/** Core imports */
import { Injectable } from '@angular/core';

/** Third party imports */
import { Observable, ReplaySubject } from 'rxjs';

@Injectable()
export class BankCodeLayoutService {
    private headerSubject: ReplaySubject<any>= new ReplaySubject<Object>(1);
    headerSubject$: Observable<any>= this.headerSubject.asObservable();

    headerContentUpdate(component) {
        this.headerSubject.next(component);
    }
}
