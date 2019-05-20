import { BehaviorSubject, Subject, Observable } from 'rxjs';

export abstract class CFOServiceBase {
    instanceId: number;
    instanceType: string;
    initialized: boolean;
    hasTransactions: boolean;
    hasStaticInstance: boolean;
    statusActive: BehaviorSubject<boolean>;
    instanceTypeChanged: Subject<string> = new Subject();
    instanceTypeChanged$: Observable<string> = this.instanceTypeChanged.asObservable();
    isForUser: boolean;

    constructor() { }
}
