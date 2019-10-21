/** Core imports */
import { Injectable, Injector } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import { Observable, ReplaySubject, Subject } from 'rxjs';
import { tap, switchMap } from 'rxjs/operators';
import invert from 'lodash/invert';

/** Application imports */
import { DialogService } from '@app/shared/common/dialogs/dialog.service';
import { AddCompanyDialogComponent } from './add-company-dialog/add-company-dialog.component';
import {
    ContactInfoDto,
    OrganizationContactInfoDto,
    UserServiceProxy,
    ContactCommunicationServiceProxy,
    SendEmailInput
} from '@shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { EmailTemplateDialogComponent } from '@app/crm/shared/email-template-dialog/email-template-dialog.component';
import { InvoiceSettingsDialogComponent } from './invoice-settings-dialog/invoice-settings-dialog.component';
import { AppPermissionService } from '@shared/common/auth/permission.service';
import { ContactGroup, ContactGroupPermission } from '@shared/AppEnums';
import { AppPermissions } from '@shared/AppPermissions';
import { NotifyService } from '@abp/notify/notify.service';

@Injectable()
export class ContactsService {
    private verificationSubject: Subject<any> = new Subject<any>();
    private toolbarSubject: Subject<any> = new Subject<any>();
    private userSubject: Subject<number> = new Subject<any>();
    private organizationUnits: ReplaySubject<any> = new ReplaySubject<any>(1);
    private organizationUnitsSave: Subject<any> = new Subject<any>();
    private invalidateSubject: Subject<any> = new Subject<any>();
    private loadLeadInfoSubject: Subject<any> =  new Subject<any>();
    private leadInfoSubject: ReplaySubject<any> = new ReplaySubject<any>(1);
    private contactInfo: ReplaySubject<ContactInfoDto> = new ReplaySubject<ContactInfoDto>(1);
    contactInfo$: Observable<ContactInfoDto> = this.contactInfo.asObservable();
    organizationContactInfo: ReplaySubject<OrganizationContactInfoDto> = new ReplaySubject<OrganizationContactInfoDto>(1);
    private subscribers: any = {
        common: []
    };

    readonly CONTACT_GROUP_KEYS = invert(ContactGroup);

    constructor(injector: Injector,
        private emailProxy: ContactCommunicationServiceProxy,
        private userService: UserServiceProxy,
        private permission: AppPermissionService,
        private dialogService: DialogService,
        private notifyService: NotifyService,
        private ls: AppLocalizationService,
        private router: Router,
        private location: Location,
        public dialog: MatDialog
    ) {}

    private subscribe(sub, ident = 'common') {
        if (!this.subscribers[ident])
            this.subscribers[ident] = [];
        this.subscribers[ident].push(sub);
        return sub;
    }

    getCGPermissionKey(contactGroup: string, permission = ''): string {
        return ContactGroupPermission[
            this.CONTACT_GROUP_KEYS[contactGroup]
        ] + (permission ? '.' : '') + permission;
    }

    checkCGPermission(contactGroup: string, permission = 'Manage') {
        return this.permission.isGranted(this.getCGPermissionKey(contactGroup, permission) as AppPermissions);
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

    invalidateUserData() {
        let userData = this.userService['data'];
        if (userData) {
            userData.raw = undefined;
            this.userUpdate(userData.userId);
        }
    }

    contactInfoSubscribe(callback, ident?: string) {
        return this.subscribe(this.contactInfo.asObservable().subscribe(callback), ident);
    }

    contactInfoUpdate(contactInfo: ContactInfoDto) {
        this.contactInfo.next(contactInfo);
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

    leadInfoSubscribe(callback, ident?: string) {
        return this.subscribe(this.leadInfoSubject.asObservable().subscribe(callback), ident);
    }

    leadInfoUpdate(data?) {
        this.leadInfoSubject.next(data);
    }

    loadLeadInfoSubscribe(callback, ident?: string) {
        return this.subscribe(this.loadLeadInfoSubject.asObservable().subscribe(callback), ident);
    }

    loadLeadInfo() {
        this.loadLeadInfoSubject.next();
    }

    unsubscribe(ident = 'common') {
        let list = this.subscribers[ident];
        list.forEach((sub) => {
            if (!sub.closed)
                sub.unsubscribe();
        });
        list.length = 0;
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
            position: this.dialogService.calculateDialogPosition(
                event, event.target, shiftX, shiftY
            )
        }).afterClosed().pipe(tap(response => {
            if (response && response.organizationId)
                setTimeout(() => this.invalidateUserData(), 300);
        }));
    }

    updateLocation(contactId?, leadId?, companyId?, userId?) {
        this.location.replaceState(
            this.router.createUrlTree(
                ['app/' + (userId ? 'admin' : 'crm')].concat(
                    contactId ? ['contact', contactId] : [],
                    leadId ? ['lead', leadId] : [],
                    companyId ? ['company', companyId] : [],
                    userId ? ['user', userId, 'user-information'] : []
                )
            ).toString(),
            location.search
        );
    }

    showEmailDialog(data = {}, title = 'Email') {
        let dialogComponent = this.dialog.open(EmailTemplateDialogComponent, {
            id: 'permanent',
            panelClass: 'slider',
            disableClose: true,
            closeOnNavigation: false,
            data: {
                saveTitle: this.ls.l('Send'),
                title: this.ls.l(title),
                ...data
            }
        }).componentInstance;
        return dialogComponent.onSave.asObservable().pipe(switchMap(res => {
            dialogComponent.startLoading();
            return this.emailProxy.sendEmail(new SendEmailInput(res));
        }), tap(() => {
            dialogComponent.finishLoading();
            this.notifyService.info(this.ls.l('MailSent'));
        }));
    }

    showInvoiceSettingsDialog() {
        this.dialog.open(InvoiceSettingsDialogComponent, {
            panelClass: 'slider',
            disableClose: true,
            closeOnNavigation: false,
            data: { }
        });
    }
}
