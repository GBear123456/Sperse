import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable()
export class SynchProgressService {

    private syncCompleted = new Subject<string>();
    syncCompleted$ = this.syncCompleted.asObservable();

    private needRefreshSync = new Subject<string>();
    needRefreshSync$ = this.needRefreshSync.asObservable();

    constructor() { }

    syncProgressCompleted() {
        this.syncCompleted.next();
    }

    refreshSyncComponent() {
        this.needRefreshSync.next();
    }
}
