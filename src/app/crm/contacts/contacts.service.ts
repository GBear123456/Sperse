import { Injectable, Injector } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { ReplaySubject, Subject } from 'rxjs';

import { DialogService } from '@app/shared/common/dialogs/dialog.service';
import { AddCompanyDialogComponent } from './add-company-dialog/add-company-dialog.component';
import { ContactInfoDto, OrganizationContactInfoDto } from '@shared/service-proxies/service-proxies';

@Injectable()
export class ContactsService {
    private verificationSubject: Subject<any>;
    private toolbarSubject: Subject<any>;
    private userSubject: Subject<number>;
    private organizationUnits: Subject<any>;
    private organizationUnitsSave: Subject<any>;
    private invalidateSubject: Subject<any>;
    private leadInfoSubject: Subject<any>;
    private contactInfoSubject: ReplaySubject<ContactInfoDto> = new ReplaySubject<ContactInfoDto>();
    organizationContactInfo: ReplaySubject<OrganizationContactInfoDto> = new ReplaySubject<OrganizationContactInfoDto>();
    private subscribers: any = {
        common: []
    };

    constructor(injector: Injector,
        private _dialogService: DialogService,
        private _router: Router,
        private _location: Location,
        public dialog: MatDialog
    ) {
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

    verificationSubscribe(callback, ident?: string) {
        return this.subscribe(this.verificationSubject.asObservable().subscribe(callback), ident);
    }

    verificationUpdate() {
        this.verificationSubject.next();
    }

    toolbarSubscribe(callback, ident?: string) {
        return this.subscribe(this.toolbarSubject.asObservable().subscribe(callback), ident);
    }

    toolbarUpdate(config = null) {
        this.toolbarSubject.next(config);
    }

    userSubscribe(callback, ident?: string) {
        return this.subscribe(this.userSubject.asObservable().subscribe(callback), ident);
    }

    userUpdate(userId) {
        this.userSubject.next(userId);
    }

    contactInfoSubscribe(callback, ident?: string) {
        return this.subscribe(this.contactInfoSubject.asObservable().subscribe(callback), ident);
    }

    contactInfoUpdate(contactInfo: ContactInfoDto) {
        this.contactInfoSubject.next(contactInfo);
    }

    organizationInfoSubscribe(callback, ident?: string) {
        return this.subscribe((this.organizationContactInfo.asObservable().subscribe(callback)), ident);
    }

    organizationInfoUpdate(organizationInfo: OrganizationContactInfoDto) {
        this.organizationContactInfo.next(organizationInfo);
    }

    orgUnitsSubscribe(callback, ident?: string) {
        return this.subscribe(this.organizationUnits.asObservable().subscribe(callback), ident);
    }

    orgUnitsUpdate(userData) {
        this.organizationUnits.next(userData);
    }

    orgUnitsSaveSubscribe(callback, ident?: string) {
        return this.subscribe(this.organizationUnitsSave.asObservable().subscribe(callback), ident);
    }

    orgUnitsSave(data) {
        this.organizationUnitsSave.next(data);
    }

    invalidateSubscribe(callback, ident?: string) {
        return this.subscribe(this.invalidateSubject.asObservable().subscribe(callback), ident);
    }

    invalidate(area?: string) {
        this.invalidateSubject.next(area);
    }

    loadLeadInfoSubscribe(callback, ident?: string) {
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

    addCompanyDialog(event, contactInfo, shiftX?, shiftY?) {
        this.dialog.closeAll();
        event.stopPropagation();

        return this.dialog.open(AddCompanyDialogComponent, {
            data: {
                contactId: contactInfo.id,
                contactInfo: contactInfo,
                updateLocation: this.updateLocation.bind(this)
            },
            hasBackdrop: false,
            position: this._dialogService.calculateDialogPosition(
                event, event.target, shiftX, shiftY)
        }).afterClosed();
    }

    updateLocation(customerId?, leadId?, partnerId?, companyId?) {
        this._location.replaceState(this._router.createUrlTree(['app/crm'].concat(
            customerId ? ['client', customerId] : [],
            leadId ? ['lead', leadId] : [],
            partnerId ? ['partner', partnerId] : [],
            companyId ? ['company', companyId] : []
        )).toString(), location.search);
    }
}
