import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable()
export class SynchProgressService {

    private syncCompleted = new Subject<string>();
    syncCompleted$ = this.syncCompleted.asObservable();

    private needRefreshSync = new Subject<string>();
    needRefreshSync$ = this.needRefreshSync.asObservable();

    private startSynchronization = new Subject<boolean>();
    startSynchronization$ = this.startSynchronization.asObservable();

    constructor() { }

    syncStart() {
        this.startSynchronization.next();
    }

    syncProgressCompleted() {
        this.syncCompleted.next();
    }

    refreshSyncComponent() {
        this.needRefreshSync.next();
    }
}
