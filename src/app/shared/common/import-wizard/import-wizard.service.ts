import { Injectable, Injector } from '@angular/core';
import { Subscription, Subject } from 'rxjs';
import { RouteReuseStrategy } from '@angular/router';
import { ImportStatus } from '@shared/AppEnums';
import { ImportServiceProxy } from '@shared/service-proxies/service-proxies';
import { PermissionCheckerService } from '@abp/auth/permission-checker.service';

@Injectable()
export class ImportWizardService {
    private subjectProgress: Subject<any>;
    private subjectCancel: Subject<any>;
    private subscribers: Array<Subscription> = [];
    private statusCheckTimeout: any;

    public activeImportId = 0;

    constructor(injector: Injector,
        private _reuseService: RouteReuseStrategy,
        private _importProxy: ImportServiceProxy,
        private _permissionService: PermissionCheckerService
    ) {
        this.subjectProgress = new Subject<any>();
        this.subjectCancel = new Subject<any>();
    }

    progressListen(callback: (progress: any) => any) {
        let subscription = this.subjectProgress.
            asObservable().subscribe(callback);
        this.subscribers.push(subscription);
        return subscription;
    }

    progressChanged(data: any) {
        this.subjectProgress.next(data);
    }

    cancelListen(callback: (importIds) => any) {
        this.subjectCancel.asObservable().subscribe(callback);
    }

    cancelImport(importIds = undefined) {
        this.subjectCancel.next(importIds);
    }

    startStatusCheck(importId = undefined, method = undefined, invalUri = undefined) {
        if (this._permissionService.isGranted('Pages.CRM.BulkImport'))
            this.setupCheckTimeout((callback) => {
                this._importProxy.getStatuses(importId).subscribe((res) => {
                    if (res && res.length) {
                        if (res.length > 1)
                            this.activeImportId = undefined;
                        else {
                            let importStatus = res[0];
                            method && method(importStatus);
                            if ([ImportStatus.Completed, ImportStatus.Cancelled].indexOf(<ImportStatus>importStatus.statusId) >= 0) {
                                invalUri && (<any>this._reuseService).invalidate(invalUri);
                                this.activeImportId = undefined;
                            }
                            if (<ImportStatus>importStatus.statusId == ImportStatus.InProgress)
                                this.activeImportId = importId;
                        }
                    }
                    callback(res);
                });
            });
    }

    finishStatusCheck() {
        this.activeImportId = undefined;
        clearTimeout(this.statusCheckTimeout);
        this.statusCheckTimeout = null;
    }

    setupCheckTimeout(method: (callback: any) => void, initial = true) {
        clearTimeout(this.statusCheckTimeout);
        this.statusCheckTimeout = setTimeout(() => {
            method((data) => {
                this.progressChanged(data);
                if (this.statusCheckTimeout)
                    this.setupCheckTimeout(method, false);
            });
        }, initial ? 0 : 5000);
    }

    unsubscribe() {
        this.subscribers.map((sub) => {
            return void (sub.unsubscribe());
        });
        this.subscribers.length = 0;
    }
}
