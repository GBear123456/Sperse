/** Core imports */
import { Injectable, Injector } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import { Observable, ReplaySubject, Subject, of, BehaviorSubject } from 'rxjs';
import { filter, finalize, tap, switchMap, catchError, map, mapTo, distinctUntilChanged } from 'rxjs/operators';

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
    ISendEmailInput,
    SendEmailInput,
    ISendSMSInput,
    SendSMSInput,
    CreatePersonOrgRelationOutput,
    CreateContactPhotoInput,
    ContactPhotoServiceProxy,
    InvoiceServiceProxy,
    PersonContactInfoDto,
    GetContactInfoForMergeOutput,
    LeadServiceProxy,
    EmailTemplateType
} from '@shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { EmailTemplateDialogComponent } from '@app/crm/shared/email-template-dialog/email-template-dialog.component';
import { InvoiceSettingsDialogComponent } from './invoice-settings-dialog/invoice-settings-dialog.component';
import { AppPermissionService } from '@shared/common/auth/permission.service';
import { NotifyService } from '@abp/notify/notify.service';
import { StringHelper } from '@shared/helpers/StringHelper';
import { MergeContactDialogComponent } from '@app/crm/contacts/merge-contact-dialog/merge-contact-dialog.component';
import { UploadPhotoDialogComponent } from '@app/shared/common/upload-photo-dialog/upload-photo-dialog.component';
import { UploadPhoto } from '@app/shared/common/upload-photo-dialog/upload-photo.model';
import { SMSDialogComponent } from '@app/crm/shared/sms-dialog/sms-dialog.component';
import { CacheHelper } from '@shared/common/cache-helper/cache-helper';
import { CacheService } from 'ng2-cache-service';
import { SmsDialogData } from '@app/crm/shared/sms-dialog/sms-dialog-data.interface';
import { AppPermissions } from '@shared/AppPermissions';
import { ContactGroup, ContactStatus } from '@shared/AppEnums';
import { ContactsHelper } from '@shared/crm/helpers/contacts-helper';
import { EmailTags } from './contacts.const';

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
    private leadInfoSubject: BehaviorSubject<any> = new BehaviorSubject<any>(undefined);
    leadInfo$: Observable<any> = this.leadInfoSubject.asObservable();
    private contactInfo: ReplaySubject<ContactInfoDto> = new ReplaySubject<ContactInfoDto>(1);
    contactInfo$: Observable<ContactInfoDto> = this.contactInfo.asObservable();
    contactId: ReplaySubject<number> = new ReplaySubject<number>(1);
    contactId$: Observable<number> = this.contactId.asObservable().pipe(
        filter((contactId: number) => !!contactId)
    );
    private organizationContactInfo: ReplaySubject<OrganizationContactInfoDto> = new ReplaySubject<OrganizationContactInfoDto>(1);
    organizationContactInfo$: Observable<OrganizationContactInfoDto> = this.organizationContactInfo.asObservable();
    private subscribers: any = {
        common: []
    };
    private personContactInfo: ReplaySubject<PersonContactInfoDto> = new ReplaySubject(1);
    personContactInfo$: Observable<PersonContactInfoDto> = this.personContactInfo.asObservable();
    readonly settingsDialogOpenedCacheKey: string = this.cacheHelper.getCacheKey('save_option_opened_settings');
    settingsDialogOpened: BehaviorSubject<boolean> = new BehaviorSubject(this.cacheService.get(this.settingsDialogOpenedCacheKey) || true);
    settingsDialogOpened$: Observable<boolean> = this.settingsDialogOpened.asObservable().pipe(
        distinctUntilChanged()
    );

    constructor(injector: Injector,
        private contactProxy: ContactServiceProxy,
        private leadService: LeadServiceProxy,
        private invoiceProxy: InvoiceServiceProxy,
        private communicationProxy: ContactCommunicationServiceProxy,
        private permission: AppPermissionService,
        private userService: UserServiceProxy,
        private dialogService: DialogService,
        private notifyService: NotifyService,
        private ls: AppLocalizationService,
        private router: Router,
        private location: Location,
        private cacheHelper: CacheHelper,
        private cacheService: CacheService,
        private contactPhotoServiceProxy: ContactPhotoServiceProxy,
        public dialog: MatDialog
    ) {}

    private subscribe(sub, ident = 'common') {
        if (!this.subscribers[ident])
            this.subscribers[ident] = [];
        this.subscribers[ident].push(sub);
        return sub;
    }

    updatePersonContactInfo(personContactInfo: PersonContactInfoDto) {
        this.personContactInfo.next(personContactInfo);
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

    openSettingsDialog() {
        this.cacheService.set(this.settingsDialogOpenedCacheKey, true);
        this.settingsDialogOpened.next(true);
    }

    closeSettingsDialog() {
        this.cacheService.set(this.settingsDialogOpenedCacheKey, false);
        this.settingsDialogOpened.next(false);
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

        let leadInfo = this.leadInfoSubject.getValue();
        return this.dialog.open(AddCompanyDialogComponent, {
            data: {
                leadId: leadInfo && leadInfo.id,
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

    updateLocation(contactId?, leadId?, companyId?, userId?, queryParams?, section?) {
        this.router.navigate(
            ['app/' + (userId ? 'admin' : 'crm')].concat(
                contactId ? ['contact', contactId] : [],
                leadId ? ['lead', leadId] : [],
                companyId ? ['company', companyId] : [],
                userId ? ['user', userId] : [],
                section || location.pathname.split('/').pop()
            ), {
            queryParams: queryParams || location.search.slice(1).split('&').reduce((acc, item) => {
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

    initSuggestionEmails(emailData) {
        if (emailData.contact) {
            emailData.contactId = emailData.contact.id;
            emailData.suggestionEmails = emailData.contact.personContactInfo.details.emails
                .filter(item => item.isActive).map(item => item.emailAddress);
            if (emailData.suggestionEmails.length)
                emailData.to = [emailData.suggestionEmails[0]];
        }
    }

    initEmailDialogTagsList(dialogComponent) {
        if (!dialogComponent.tagsList || !dialogComponent.tagsList.length) {
            dialogComponent.tagsList = [
                EmailTags.FirstName, EmailTags.LastName, EmailTags.SenderFullName,
                EmailTags.SenderPhone, EmailTags.SenderEmail, EmailTags.SenderWebSite1,
                EmailTags.SenderWebSite2, EmailTags.SenderWebSite3, EmailTags.SenderCompany,
                EmailTags.SenderCompanyTitle, EmailTags.SenderCompanyLogo, EmailTags.SenderCompanyPhone,
                EmailTags.SenderCompanyEmail, EmailTags.SenderCompanyWebSite, EmailTags.SenderCalendly,
                EmailTags.SenderAffiliateCode
            ];
        }
    }

    showEmailTemplateDialog(templateId?: number) {
        let dialogComponent = this.dialog.open(EmailTemplateDialogComponent, {
            panelClass: 'slider',
            disableClose: true,
            closeOnNavigation: false,
            data: {
                title: templateId ? this.ls.l('Edit Template') : this.ls.l('Add Template'),
                templateType: 'Contact',
                templateId: templateId,
                saveTitle: this.ls.l('Save')
            }
        }).componentInstance;
        this.initEmailDialogTagsList(dialogComponent);
        dialogComponent.templateEditMode = true;
        return dialogComponent.onSave.pipe(tap(() => {
            dialogComponent.close();
        }));
    }

    showEmailDialog(data: any = {}, title = 'Email', onTemplateChange?: (templateId: number, emailData: any) => Observable<void>): Observable<number> {
        let emailData: any = {
            saveTitle: this.ls.l('Send'),
            title: this.ls.l(title),
            ...data
        };

        if (!emailData.templateType)
            emailData.templateType = EmailTemplateType.Contact;
        if (emailData.contact)
            this.initSuggestionEmails(emailData);
        else if (emailData.contactId)
            this.getContactInfo(emailData.contactId).subscribe(res => {
                emailData.contact = res;
                this.initSuggestionEmails(emailData);
            });

        let dialogComponent = this.dialog.open(EmailTemplateDialogComponent, {
            panelClass: 'slider',
            disableClose: true,
            closeOnNavigation: false,
            data: emailData
        }).componentInstance;

        if (emailData.templateType == EmailTemplateType.Contact)
            dialogComponent.onTemplateCreate.subscribe((templateId: number) => {
                this.showEmailTemplateDialog(templateId).subscribe(data => {
                    dialogComponent.data.templateId = data.templateId;
                    dialogComponent.onTemplateChanged({value: data.templateId});
                    dialogComponent.initTemplateList();
                });
            });

        dialogComponent.onTemplateChange.pipe(
            switchMap(tmpId => {
                dialogComponent.startLoading();
                return (onTemplateChange ? onTemplateChange(tmpId, emailData) :
                    this.communicationProxy.getEmailData(tmpId, emailData.contactId).pipe(map(data => {
                        Object.assign(emailData, data);
                    }))
                ).pipe(
                    finalize(() => dialogComponent.finishLoading())
                );
            })
        ).subscribe(() => dialogComponent.invalidate());

        this.initEmailDialogTagsList(dialogComponent);
        return dialogComponent.onSave.pipe(
            switchMap(res => {
                dialogComponent.startLoading();
                if (res.attachments)
                    res.attachments = res.attachments.map(item => item.id);
                return this.sendEmail(res).pipe(
                    finalize(() => dialogComponent.finishLoading())
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

    sendEmail(input: ISendEmailInput) {
        return this.communicationProxy.sendEmail(new SendEmailInput(input)).pipe(
            catchError(error => of(error))
        );
    }

    sendSMS(input: ISendSMSInput) {
        return this.communicationProxy.sendSMS(new SendSMSInput(input)).pipe(
            catchError(error => of(error))
        );
    }

    showInvoiceEmailDialog(invoiceId: number, data: any = {}) {
        data.templateType = EmailTemplateType.Invoice;
        return this.showEmailDialog(data, 'Email', (tmpId, emailData) => {
            return this.invoiceProxy.getEmailData(tmpId, invoiceId).pipe(
                map((email: GetEmailDataOutput) => {
                    Object.assign(emailData, email);
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

    showSMSDialog(data: SmsDialogData) {
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

    showMergeContactDialog(
        sourceInfo,
        targetInfo,
        loadFinalize = () => {},
        keepSource = true,
        keepTarget = true
    ) {
        return this.contactProxy.getContactInfoForMerge(
            sourceInfo.id, sourceInfo.leadId,
            targetInfo.id, targetInfo.leadId
        ).pipe(finalize(
            () => loadFinalize()
        ), switchMap((response: GetContactInfoForMergeOutput) => {
            return this.dialog.open(MergeContactDialogComponent, {
                panelClass: 'slider',
                disableClose: true,
                closeOnNavigation: false,
                data: {
                    mergeInfo: response,
                    keepSource: keepSource,
                    keepTarget: keepTarget
                }
            }).afterClosed();
        }));
    }

    deleteContact(customerName, contactGroup, entityId, callback?, isLead = false ) {
        let text = this.ls.l('LeadDeleteWarningMessage', customerName);
        let canForceDelete = this.permission.isGranted(AppPermissions.CRMForceDeleteEntites);
        if (isLead) {
            ContactsHelper.showConfirmMessage(text, this.ls.l('ForceDelete'), (isConfirmed, forceDelete) => {
                if (isConfirmed) {
                    this.leadService.deleteLead(entityId, forceDelete).subscribe(() => {
                        abp.notify.success(this.ls.l('SuccessfullyDeleted'));
                        this.contactProxy['data']['deleted'] = true;
                        callback && callback();
                    });
                }
            },
            canForceDelete);
        } else {
            let text = contactGroup == ContactGroup.Partner ? this.ls.l('PartnerDeleteWarningMessage', customerName) : this.ls.l('ContactDeleteWarningMessage', customerName);
            ContactsHelper.showConfirmMessage(
                text, this.ls.l('ForceDelete'), (isConfirmed, forceDelete) => {
                    if (isConfirmed) {
                        this.contactProxy.deleteContact(entityId, forceDelete).subscribe(() => {
                            abp.notify.success(this.ls.l('SuccessfullyDeleted'));
                            callback && callback();
                        });
                    }
                },
                canForceDelete);
        }
    }

    mergeContact(source, target, keepSource?: boolean, keepTarget?: boolean, callback?, isLead = false) {
        abp.ui.setBusy();
        this.showMergeContactDialog(
            {
                id: isLead ? source.CustomerId : source.Id,
                leadId: isLead ? source.Id : ''
            },
            {
                id: isLead ? target.CustomerId : target.Id,
                leadId: isLead ? target.Id : ''
            },
            () => abp.ui.clearBusy(),
            keepSource,
            keepTarget
        ).subscribe((success: boolean) => {
            if (success && callback)
                callback();
        });
    }
}