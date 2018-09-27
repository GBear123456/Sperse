import { Injectable, Injector } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable()
export class ContactsService {
    private verificationSubject: Subject<any>;
    private toolbarSubject: Subject<any>;
    private userSubject: Subject<number>;
    private organizationUnits: Subject<any>;
    private organizationUnitsSave: Subject<any>;
    private invalidateSubject: Subject<any>;
    private leadInfoSubject: Subject<any>;
    private subscribers: any = {
        common: []
    };

    constructor(injector: Injector) {
        this.verificationSubject = new Subject<any>();
        this.toolbarSubject = new Subject<any>();
        this.userSubject = new Subject<any>();
        this.organizationUnits = new Subject<any>();
        this.organizationUnitsSave = new Subject<any>();
        this.invalidateSubject = new Subject<any>();
        this.leadInfoSubject =  new Subject<any>();
    }

    private subscribe(sub, ident = 'common') {
        if (!this.subscribers[ident])
            this.subscribers[ident] = [];
        this.subscribers[ident].push(sub);
        return sub;
    }

    verificationSubscribe(callback, ident = undefined) {
        return this.subscribe(this.verificationSubject.asObservable().subscribe(callback), ident);
    }

    verificationUpdate() {
        this.verificationSubject.next();
    }

    toolbarSubscribe(callback, ident = undefined) {
        return this.subscribe(this.toolbarSubject.asObservable().subscribe(callback), ident);
    }

    toolbarUpdate(config = null) {
        this.toolbarSubject.next(config);
    }

    userSubscribe(callback, ident = undefined) {
        return this.subscribe(this.userSubject.asObservable().subscribe(callback), ident);
    }

    userUpdate(userId) {
        this.userSubject.next(userId);
    }

    orgUnitsSubscribe(callback, ident = undefined) {
        return this.subscribe(this.organizationUnits.asObservable().subscribe(callback), ident);
    }

    orgUnitsUpdate(userData) {
        this.organizationUnits.next(userData);
    }

    orgUnitsSaveSubscribe(callback, ident = undefined) {
        return this.subscribe(this.organizationUnitsSave.asObservable().subscribe(callback), ident);
    }

    orgUnitsSave(data) {
        this.organizationUnitsSave.next(data);
    }

    invalidateSubscribe(callback, ident = undefined) {
        return this.subscribe(this.invalidateSubject.asObservable().subscribe(callback), ident);
    }

    invalidate() { 
        this.invalidateSubject.next();
    }

    loadLeadInfoSubscribe(callback, ident = undefined) {
        return this.subscribe(this.leadInfoSubject.asObservable().subscribe(callback), ident);
    }

    loadLeadInfo() { 
        this.leadInfoSubject.next();
    }

    unsubscribe(ident = 'common') {
        let list = this.subscribers[ident];
        list.forEach((sub) => {
            if (!sub.closed)
                sub.unsubscribe();
        });
        list.lendth = 0;
    }
}