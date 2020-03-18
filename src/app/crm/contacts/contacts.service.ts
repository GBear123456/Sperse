/** Core imports */
import { Injectable, Injector } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import { Observable, ReplaySubject, Subject, of } from 'rxjs';
import { filter, finalize, tap, switchMap, catchError, map, mapTo } from 'rxjs/operators';
import invert from 'lodash/invert';

/** Application imports */
import { DialogService } from '@app/shared/common/dialogs/dialog.service';
import { AddCompanyDialogComponent } from './add-company-dialog/add-company-dialog.component';
import {
    ContactInfoDto,
    GetEmailDataOutput,
    OrganizationContactInfoDto,
    UserServiceProxy,
    ContactServiceProxy,
    ContactCommunicationServiceProxy,
    SendEmailInput,
    CreatePersonOrgRelationOutput,
    CreateContactPhotoInput,
    ContactPhotoServiceProxy,
    InvoiceServiceProxy
} from '@shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { EmailTemplateDialogComponent } from '@app/crm/shared/email-template-dialog/email-template-dialog.component';
import { InvoiceSettingsDialogComponent } from './invoice-settings-dialog/invoice-settings-dialog.component';
import { AppPermissionService } from '@shared/common/auth/permission.service';
import { ContactGroup, ContactGroupPermission } from '@shared/AppEnums';
import { AppPermissions } from '@shared/AppPermissions';
import { NotifyService } from '@abp/notify/notify.service';
import { StringHelper } from '@shared/helpers/StringHelper';
import { UploadPhotoDialogComponent } from '@app/shared/common/upload-photo-dialog/upload-photo-dialog.component';
import { UploadPhoto } from '@app/shared/common/upload-photo-dialog/upload-photo.model';
import { SMSDialogComponent } from '@app/crm/shared/sms-dialog/sms-dialog.component';

@Injectable()
export class ContactsService {
    private verificationSubject: Subject<any> = new Subject<any>();
    private toolbarSubject: Subject<any> = new Subject<any>();
    private userId: ReplaySubject<number> = new ReplaySubject(1);
    userId$: Observable<number> = this.userId.asObservable();
    private organizationUnits: ReplaySubject<any> = new ReplaySubject<any>(1);
    private organizationUnitsSave: Subject<any> = new Subject<any>();
    private invalidateSubject: Subject<any> = new Subject<any>();
    private loadLeadInfoSubject: Subject<any> =  new ReplaySubject<any>(1);
    private leadInfoSubject: ReplaySubject<any> = new ReplaySubject<any>(1);
    private contactInfo: ReplaySubject<ContactInfoDto> = new ReplaySubject<ContactInfoDto>(1);
    contactInfo$: Observable<ContactInfoDto> = this.contactInfo.asObservable();
    organizationContactInfo: ReplaySubject<OrganizationContactInfoDto> = new ReplaySubject<OrganizationContactInfoDto>(1);
    private subscribers: any = {
        common: []
    };

    readonly CONTACT_GROUP_KEYS = invert(ContactGroup);

    constructor(injector: Injector,
        private contactProxy: ContactServiceProxy,
        private invoiceProxy: InvoiceServiceProxy,
        private emailProxy: ContactCommunicationServiceProxy,
        private permission: AppPermissionService,
        private userService: UserServiceProxy,
        private dialogService: DialogService,
        private notifyService: NotifyService,
        private ls: AppLocalizationService,
        private router: Router,
        private location: Location,
        private contactPhotoServiceProxy: ContactPhotoServiceProxy,
        public dialog: MatDialog
    ) {}

    private subscribe(sub, ident = 'common') {
        if (!this.subscribers[ident])
            this.subscribers[ident] = [];
        this.subscribers[ident].push(sub);
        return sub;
    }

    getCGPermissionKey(contactGroup: ContactGroup, permission = ''): string {
        return ContactGroupPermission[
            this.CONTACT_GROUP_KEYS[contactGroup ? contactGroup.toString() : undefined]
        ] + (permission ? '.' : '') + permission;
    }

    checkCGPermission(contactGroup: ContactGroup, permission = 'Manage') {
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
        return this.subscribe(this.userId$.subscribe(callback), ident);
    }

    updateUserId(userId: number) {
        this.userId.next(userId);
    }

    invalidateUserData() {
        let userData = this.userService['data'];
        if (userData) {
            userData.raw = undefined;
            this.updateUserId(userData.userId);
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
        if (list) {
            list.forEach((sub) => {
                if (!sub.closed)
                    sub.unsubscribe();
            });
            list.length = 0;
        }
    }

    addCompanyDialog(event, contactInfo, shiftX?, shiftY?): Observable<CreatePersonOrgRelationOutput> {
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
        }).afterClosed().pipe(
            tap(response => {
                if (response && response.organizationId)
                    setTimeout(() => this.invalidateUserData(), 300);
            })
        );
    }

    showUploadPhotoDialog(company: any, event): Observable<any> {
        event.stopPropagation();
        return this.dialog.open(UploadPhotoDialogComponent, {
            data: { ...company, ...this.getCompanyPhoto(company) },
            hasBackdrop: true
        }).afterClosed().pipe(
            filter(Boolean),
            switchMap((result: UploadPhoto) => {
                let action$: Observable<any>;
                if (result.clearPhoto) {
                    action$ = this.contactPhotoServiceProxy.clearContactPhoto(company.id).pipe(
                        mapTo(null)
                    );
                } else {
                    let base64OrigImage = StringHelper.getBase64(result.origImage);
                    let base64ThumbImage = StringHelper.getBase64(result.thumImage);
                    action$ = this.contactPhotoServiceProxy.createContactPhoto(
                        CreateContactPhotoInput.fromJS({
                            contactId: company.id,
                            original: base64OrigImage,
                            thumbnail: base64ThumbImage,
                            source: result.source
                        })
                    ).pipe(
                        mapTo(base64OrigImage)
                    );
                }
                return action$;
            })
        );
    }

    private getCompanyPhoto(company): { source?: string } {
        return company.primaryPhoto ? { source: 'data:image/jpeg;base64,' + company.primaryPhoto } : {};
    }

    updateLocation(contactId?, leadId?, companyId?, userId?) {
        this.router.navigate(
            ['app/' + (userId ? 'admin' : 'crm')].concat(
                contactId ? ['contact', contactId] : [],
                leadId ? ['lead', leadId] : [],
                companyId ? ['company', companyId] : [],
                userId ? ['user', userId] : [],
                location.pathname.split('/').pop()
            ), {
            queryParams : location.search.slice(1).split('&').reduce((acc, item) => {
                let parts = item.split('=');
                acc[parts[0]] = decodeURIComponent(parts[1]);
                return acc;
            }, {})
        });
    }

    getContactInfo(contactId): Observable<any> {
        let contactInfo = this.contactProxy['data'] &&
            this.contactProxy['data'].contactInfo;
        return contactInfo && contactInfo.id == contactId ? of(contactInfo)
            : this.contactProxy.getContactInfo(contactId);
    }

    showEmailDialog(data: any = {}, title = 'Email', onTemplateChange?: (templateId: number, emailData: any) => Observable<void>) {
        let emailData: any = {
            saveTitle: this.ls.l('Send'),
            title: this.ls.l(title),
            ...data
        };

        if (emailData.contactId && !emailData.to)
            this.getContactInfo(data.contactId).subscribe(res => {
                  emailData.suggestionEmails = res.personContactInfo.details.emails
                      .filter(item => item.isActive).map(item => item.emailAddress);
                  if (emailData.suggestionEmails.length)
                      emailData.to = [emailData.suggestionEmails[0]];
            });

        let dialogComponent = this.dialog.open(EmailTemplateDialogComponent, {
            panelClass: 'slider',
            disableClose: true,
            closeOnNavigation: false,
            data: emailData
        }).componentInstance;

        if (onTemplateChange)
            dialogComponent.onTemplateChange.pipe(
                switchMap(tmpId => {
                    dialogComponent.startLoading();
                    return onTemplateChange(tmpId, emailData).pipe(
                        finalize(() => dialogComponent.finishLoading())
                    );
                })
            ).subscribe(() => dialogComponent.changeDetectorRef.markForCheck());

        return dialogComponent.onSave.pipe(
            switchMap(res => {
                dialogComponent.startLoading();
                return this.emailProxy.sendEmail(new SendEmailInput(res)).pipe(
                    finalize(() => dialogComponent.finishLoading()),
                    catchError(error => of(error))
                );
            }),
            tap(res => {
                if (!isNaN(res)) {
                    this.notifyService.info(this.ls.l('MailSent'));
                    dialogComponent.close();
                }
            })
        );
    }

    showInvoiceEmailDialog(invoiceId: number, data: any = {}) {
        return this.showEmailDialog(data, 'Email', (tmpId, emailData) => {
            return this.invoiceProxy.getEmailData(tmpId, invoiceId).pipe(
                map((email: GetEmailDataOutput) => {
                    emailData.cc = email.cc;
                    emailData.bcc = email.bcc;
                    emailData.body = email.body;
                    emailData.subject = email.subject;
                })
            );
        });
    }

    showInvoiceSettingsDialog() {
        return this.dialog.open(InvoiceSettingsDialogComponent, {
            panelClass: 'slider',
            disableClose: true,
            closeOnNavigation: false,
            data: {}
        }).afterClosed();
    }

    showSMSDialog(data) {
        this.dialog.closeAll();
        this.dialog.open(SMSDialogComponent, {
            id: 'permanent',
            panelClass: 'slider',
            disableClose: true,
            closeOnNavigation: false,
            data: data
        }).afterClosed().subscribe(res => {
            res && this.invalidate('user-inbox');
        });
    }
}
