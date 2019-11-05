import { BehaviorSubject, ReplaySubject, Subject, Observable } from 'rxjs';
import { InstanceType } from '@shared/service-proxies/service-proxies';
import { InstanceModel } from '@shared/cfo/instance.model';

export abstract class CFOServiceBase {
    instanceId: number;
    instanceType: InstanceType;
    initialized: boolean;
    protected _initialized: ReplaySubject<boolean> = new ReplaySubject<boolean>(1);
    initialized$: Observable<boolean> = this._initialized.asObservable();
    hasTransactions: boolean;
    hasStaticInstance: boolean;
    protected hasAccountsAccess: ReplaySubject<boolean> = new ReplaySubject<boolean>(1);
    hasAccountsAccess$: Observable<boolean> = this.hasAccountsAccess.asObservable();
    statusActive: BehaviorSubject<boolean>;
    instanceChanged: Subject<InstanceModel> = new Subject();
    instanceChanged$: Observable<InstanceModel> = this.instanceChanged.asObservable();
    isForUser: boolean;
}
