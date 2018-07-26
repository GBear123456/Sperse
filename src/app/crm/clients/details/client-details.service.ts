import { Injectable, Injector  } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable()
export class ClientDetailsService {
    private verificationSubject: Subject<any>;
    private toolbarSubject: Subject<any>;

    constructor(injector: Injector) {
        this.verificationSubject = new Subject<any>();
        this.toolbarSubject = new Subject<any>();
    }

    verificationSubscribe(callback) {
        this.verificationSubject.asObservable().subscribe(callback);
    }

    verificationUpdate() {
        this.verificationSubject.next();
    }

    toolbarSubscribe(callback) {
        this.toolbarSubject.asObservable().subscribe(callback);
    }

    toolbarUpdate(config = null) {
        this.toolbarSubject.next(config);
    }
}
