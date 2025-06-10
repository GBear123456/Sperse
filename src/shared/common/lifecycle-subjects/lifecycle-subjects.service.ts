import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from '@node_modules/rxjs';

@Injectable()
export class LifecycleSubjectsService {
    activate: Subject<boolean> = new Subject<boolean>();
    activate$: Observable<boolean> = this.activate.asObservable();
    deactivate: Subject<null> = new Subject<null>();
    deactivate$: Observable<null> = this.deactivate.asObservable();
    destroy: Subject<null> = new Subject<null>();
    destroy$: Observable<null> = this.destroy.asObservable();
}
