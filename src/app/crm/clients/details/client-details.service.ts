import { Injectable, Injector  } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable()
export class ClientDetailsService {
    private verificationSubject: Subject<any>;
    private toolbarSubject: Subject<any>;
    private userSubject: Subject<number>;
    private organizationUnits: Subject<any>;
    private organizationUnitsSave: Subject<any>;

    constructor(injector: Injector) {
        this.verificationSubject = new Subject<any>();
        this.toolbarSubject = new Subject<any>();
        this.userSubject = new Subject<any>();
        this.organizationUnits = new Subject<any>();
        this.organizationUnitsSave = new Subject<any>();
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

    userSubscribe(callback) {
        this.userSubject.asObservable().subscribe(callback);
    }

    userUpdate(userId) {
        this.userSubject.next(userId);
    }

    orgUnitsSubscribe(callback) {
        this.organizationUnits.asObservable().subscribe(callback);
    }

    orgUnitsUpdate(userData) {
        this.organizationUnits.next(userData);
    }

    orgUnitsSaveSubscribe(callback) {
        this.organizationUnitsSave.asObservable().subscribe(callback);
    }

    orgUnitsSave(data) {
        this.organizationUnitsSave.next(data);
    }
}