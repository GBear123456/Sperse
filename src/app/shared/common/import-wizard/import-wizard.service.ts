/** Core imports */
import { Injectable } from '@angular/core';

/** Third party imports */
import { Subscription, Subject } from 'rxjs';

/** Application imports */
import { ImportStatus } from '@shared/AppEnums';
import { ImportServiceProxy } from '@shared/service-proxies/service-proxies';
import { AppPermissionService } from '@shared/common/auth/permission.service';
import { AppPermissions } from '@shared/AppPermissions';
import { CustomReuseStrategy } from '@root/root-routing.module';
import { RouteReuseStrategy } from '@angular/router';

@Injectable()
export class ImportWizardService {
    private subjectProgress: Subject<any>;
    private subjectCancel: Subject<any>;
    private subscribers: Array<Subscription> = [];
    private statusCheckTimeout: any;

    public activeImportId = 0;

    constructor(
        private reuseService: RouteReuseStrategy,
        private importProxy: ImportServiceProxy,
        private permissionService: AppPermissionService
    ) {
        this.subjectProgress = new Subject<any>();
        this.subjectCancel = new Subject<number[]>();
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

    cancelListen(callback: (importIds: number[]) => any) {
        this.subjectCancel.asObservable().subscribe(callback);
    }

    cancelImport(importIds?: number[]) {
        this.subjectCancel.next(importIds);
    }

    startStatusCheck(importId?: number, method?: Function, invalUri?: string) {
        if (this.permissionService.isGranted(AppPermissions.CRMBulkImport))
            this.setupCheckTimeout((callback) => {
                this.importProxy.getStatuses(importId).subscribe((res) => {
                    if (res && res.length) {
                        if (res.length > 1)
                            this.activeImportId = undefined;
                        else {
                            let importStatus = res[0];
                            method && method(importStatus);
                            if ([ImportStatus.Completed, ImportStatus.Cancelled].indexOf(<ImportStatus>importStatus.statusId) >= 0) {
                                if (invalUri) {
                                    invalUri = (this.reuseService as CustomReuseStrategy).keyExists(invalUri) ? invalUri : 'leads';
                                    (this.reuseService as CustomReuseStrategy).invalidate(invalUri);
                                }
                                this.activeImportId = undefined;
                            }
                            if (<ImportStatus>importStatus.statusId == ImportStatus.InProgress)
                                this.activeImportId = importId;
                        }
                    } else
                        this.finishStatusCheck();
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
