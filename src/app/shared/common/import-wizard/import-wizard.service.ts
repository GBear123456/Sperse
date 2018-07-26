import { Injectable, Injector } from '@angular/core';
import { Subscription, Subject } from 'rxjs';

@Injectable()
export class ImportWizardService {
    private subjectProgress: Subject<any>;
    private subjectCancel: Subject<undefined>;
    private subscribers: Array<Subscription> = [];

    constructor(injector: Injector) {
        this.subjectProgress = new Subject<any>();
        this.subjectCancel = new Subject<undefined>();
    }

    progressListen(callback: (progress: any) => any) {
        this.subscribers.push(this.subjectProgress.
            asObservable().subscribe(callback));
    }

    progressChanged(progress: any) {
        this.subjectProgress.next(progress);
    }

    cancelListen(callback: () => any) {
        this.subjectCancel.asObservable().subscribe(callback);
    }

    cancelImport() {  
        this.subjectCancel.next();
    }

    setupStatusCheck(method: (callback: any) => void) {
        setTimeout(() => {
            method((data) => {
                this.progressChanged(data.progress);
                if (data.progress < 100)
                    this.setupStatusCheck(method);
            });
        }, 1000);
    }

    unsubscribe() {
        this.subscribers.map((sub) => {
            return void (sub.unsubscribe());
        });
        this.subscribers.length = 0;
    }
}