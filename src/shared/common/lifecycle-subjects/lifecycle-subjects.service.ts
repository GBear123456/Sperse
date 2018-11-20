import { Injectable } from '@angular/core';
import { Observable, Subject } from '@node_modules/rxjs';

@Injectable()
export class LifecycleSubjectsService {
    activate: Subject<null> = new Subject<null>();
    activate$: Observable<null> = this.activate.asObservable();
    deactivate: Subject<null> = new Subject<null>();
    deactivate$: Observable<null> = this.deactivate.asObservable();
    destroy: Subject<null> = new Subject<null>();
    destroy$: Observable<null> = this.destroy.asObservable();
}
