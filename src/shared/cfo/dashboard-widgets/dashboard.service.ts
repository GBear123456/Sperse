/** Core imports */
import { Injectable } from '@angular/core';

/** Third party imports */
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable()
export class DashboardService {

    private _refresh: BehaviorSubject<any> = new BehaviorSubject<null>(null);
    refresh$: Observable<null> = this._refresh.asObservable();

    constructor() {}

    refresh() {
        this._refresh.next(null);
    }

}
