import { Injectable, Injector } from '@angular/core';
import { Subscription, Subject } from 'rxjs';

import { RouteReuseStrategy } from '@angular/router';

import { ImportStatus } from '@shared/AppEnums';
import { ImportServiceProxy } from '@shared/service-proxies/service-proxies';

import * as _ from 'underscore';

@Injectable()
export class ImportWizardService {
    private subjectProgress: Subject<any>;
    private subjectCancel: Subject<undefined>;
    private subscribers: Array<Subscription> = [];
    private statusCheckTimeout: any;

    public activeImportId: number = 0;

    constructor(injector: Injector,
        private _reuseService: RouteReuseStrategy,
        private _importProxy: ImportServiceProxy
    ) {
        this.subjectProgress = new Subject<any>();
        this.subjectCancel = new Subject<undefined>();
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

    cancelListen(callback: () => any) {
        this.subjectCancel.asObservable().subscribe(callback);
    }

    cancelImport() {
        this.subjectCancel.next();
    }

    setupStatusCheck(importId, method = undefined, invalUri = undefined) {
        this.setupCheckTimeout((callback) => {
            this._importProxy.getStatuses(importId).subscribe((res) => {
                let importStatus = res[0];
                method && method(importStatus);
                let data = {
                     totalCount: importStatus.totalCount,
                     importedCount: importStatus.importedCount,
                     failedCount: importStatus.failedCount
                 };
                if ([ImportStatus.Completed, ImportStatus.Cancelled].indexOf(<ImportStatus>importStatus.statusId) >= 0) {
                    invalUri && (<any>this._reuseService).invalidate(invalUri);
                    callback(_.extend(data, {progress: 100}));
                    this.activeImportId = undefined;
                }
                if (<ImportStatus>importStatus.statusId == ImportStatus.InProgress) {
                    this.activeImportId = importId;
                    callback(_.extend(data, {
                        progress: Math.round(((importStatus.importedCount || 0) +
                            (importStatus.failedCount || 0)) / importStatus.totalCount * 100)
                    }));
                }
            })
        });
    }

    setupCheckTimeout(method: (callback: any) => void, initial = true) {
        clearTimeout(this.statusCheckTimeout);
        this.statusCheckTimeout = setTimeout(() => {
            method((data) => {
                this.progressChanged(data);
                if (data.progress < 100)
                    this.setupCheckTimeout(method, false);
            });
        }, initial ? 0: 5000);
    }

    unsubscribe() {
        this.subscribers.map((sub) => {
            return void (sub.unsubscribe());
        });
        this.subscribers.length = 0;
    }
}
