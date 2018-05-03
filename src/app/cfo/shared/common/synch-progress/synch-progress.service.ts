import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Subject';

@Injectable()
export class SynchProgressService {

    private syncCompleted = new Subject<string>();
    syncCompleted$ = this.syncCompleted.asObservable();

    constructor() { }

    syncProgressCompleted() {
        this.syncCompleted.next();
    }
}
