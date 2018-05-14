import { Injectable, Injector  } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { Subject } from 'rxjs/Subject';
    
@Injectable()
export class ClientDetailsService {
    private verificationSubject: Subject<any>;

    constructor(injector: Injector) {
        this.verificationSubject = new Subject<any>();
    }

    verificationSubscribe(callback) {
        this.verificationSubject.asObservable().subscribe(callback);
    }

    verificationUpdate() {
        this.verificationSubject.next();
    }    
}
