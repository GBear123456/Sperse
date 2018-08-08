import { Injectable, Injector } from '@angular/core';
import { Subscription, Subject } from 'rxjs';

@Injectable()
export class ImportWizardService {
    private subjectProgress: Subject<any>;
    private subjectCancel: Subject<undefined>;
    private subscribers: Array<Subscription> = [];

    public activeImportId: number = 0;

    constructor(injector: Injector) {
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

    setupStatusCheck(method: (callback: any) => void, initial = true) {
        setTimeout(() => {
            method((data) => {
                this.progressChanged(data);
                if (data.progress < 100)
                    this.setupStatusCheck(method, false);
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