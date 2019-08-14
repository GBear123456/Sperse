import { BehaviorSubject, Subject, Observable } from 'rxjs';
import { InstanceModel } from '@shared/cfo/instance.model';

export abstract class CFOServiceBase {
    instanceId: number;
    instanceType: string;
    initialized: boolean;
    hasTransactions: boolean;
    hasStaticInstance: boolean;
    statusActive: BehaviorSubject<boolean>;
    instanceChanged: Subject<InstanceModel> = new Subject();
    instanceChanged$: Observable<InstanceModel> = this.instanceChanged.asObservable();
    isForUser: boolean;

    constructor() { }
}
