import { Subject, Observable } from 'rxjs';

export abstract class CFOServiceBase {
    instanceId: number;
    instanceType: string;
    initialized: boolean;
    hasTransactions: boolean;
    instanceTypeChanged: Subject<string> = new Subject();
    instanceTypeChanged$: Observable<string> = this.instanceTypeChanged.asObservable();

    constructor() {
    }
}
