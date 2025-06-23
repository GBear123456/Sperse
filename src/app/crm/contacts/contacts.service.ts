/** Core imports */
import { Injectable, Injector } from '@angular/core';
import { Location } from '@angular/common';
import { Params, Router } from '@angular/router';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import { Observable, ReplaySubject, Subject, of, BehaviorSubject, Subscriber, forkJoin } from 'rxjs';
import { filter, first, finalize, tap, switchMap, catchError, map, mapTo, distinctUntilChanged } from 'rxjs/operators';
import invert from 'lodash/invert';
import startCase from 'lodash/startCase';

/** Application imports */
import { ContactStatus } from '@root/shared/AppEnums';
import { DialogService } from '@app/shared/common/dialogs/dialog.service';
import { AddCompanyDialogComponent } from './add-company-dialog/add-company-dialog.component';
import {
    ContactInfoDto,
    GetEmailDataOutput,
    OrganizationContactInfoDto,
    UserServiceProxy,
    ContactServiceProxy,
    ContactCommunicationServiceProxy,
    EmailTemplateServiceProxy,
    IBulkSendEmailInput,
    BulkSendEmailInput,
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
    EmailTemplateType,
    UpdateContactStatusInput,
    UpdateUserOptionsDto,
    DocumentServiceProxy,
    CopyTemplateInput,
    FileInfo,
    NoteInfoDto,
    LeadInfoDto
} from '@shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { EmailTemplateDialogComponent } from '@app/crm/shared/email-template-dialog/email-template-dialog.component';
import { AppPermissionService } from '@shared/common/auth/permission.service';
import { NotifyService } from 'abp-ng2-module';
import { StringHelper } from '@shared/helpers/StringHelper';
import { MergeContactDialogComponent } from '@app/crm/contacts/merge-contact-dialog/merge-contact-dialog.component';
import { UploadPhotoDialogComponent } from '@app/shared/common/upload-photo-dialog/upload-photo-dialog.component';
import { UploadPhotoResult } from '@app/shared/common/upload-photo-dialog/upload-photo-result.interface';
import { SMSDialogComponent } from '@app/crm/shared/sms-dialog/sms-dialog.component';
import { CacheHelper } from '@shared/common/cache-helper/cache-helper';
import { CacheService } from 'ng2-cache-service';
import { SmsDialogData } from '@app/crm/shared/sms-dialog/sms-dialog-data.interface';
import { AppPermissions } from '@shared/AppPermissions';
import { ContactGroup } from '@shared/AppEnums';
import { ContactsHelper } from '@shared/crm/helpers/contacts-helper';
import { EmailTags, ProductEmailTags, WelcomeEmailTags } from './contacts.const';
import { TemplateDocumentsDialogComponent } from '@app/crm/contacts/documents/template-documents-dialog/template-documents-dialog.component';
import { NoteAddDialogComponent } from '@app/crm/contacts/notes/note-add-dialog/note-add-dialog.component';
import { EmailTemplateData } from '@app/crm/shared/email-template-dialog/email-template-data.interface';
import { ItemTypeEnum } from '@shared/common/item-details-layout/item-type.enum';
import { Status } from '@app/crm/contacts/operations-widget/status.interface';
import { AddCompanyDialogData } from '@app/crm/contacts/add-company-dialog/add-company-dialog-data.interface';
import { UploadPhotoData } from '@app/shared/common/upload-photo-dialog/upload-photo-data.interface';
import { NoteAddDialogData } from '@app/crm/contacts/notes/note-add-dialog/note-add-dialog-data.interface';
import { TemplateDocumentsDialogData } from '@app/crm/contacts/documents/template-documents-dialog/template-documents-dialog-data.interface';
import { AppAuthService } from '@shared/common/auth/app-auth.service';
import { AppFeatures } from '@shared/AppFeatures';
import { AppService } from '@app/app.service';
import { AppConsts } from '@shared/AppConsts';

@Injectable()
export class ContactsService {
    private verificationSubject: Subject<any> = new Subject<any>();
    private toolbarSubject: Subject<any> = new Subject<any>();
    private userId: BehaviorSubject<number> = new BehaviorSubject(undefined);
    userId$: Observable<number> = this.userId.asObservable();
    private organizationUnits: ReplaySubject<any> = new ReplaySubject<any>(1);
    private organizationUnitsSave: Subject<any> = new Subject<any>();
    private invalidateSubject: Subject<any> = new Subject<any>();
    private loadLeadInfoSubject: Subject<any> =  new ReplaySubject<any>(1);
    private leadInfoSubject: BehaviorSubject<LeadInfoDto> = new BehaviorSubject<LeadInfoDto>(undefined);
    leadInfo$: Observable<LeadInfoDto> = this.leadInfoSubject.asObservable();
    private contactInfo: ReplaySubject<ContactInfoDto> = new ReplaySubject<ContactInfoDto>(1);
    contactInfo$: Observable<ContactInfoDto> = this.contactInfo.asObservable();
    contactId: ReplaySubject<number> = new ReplaySubject<number>(1);
    contactId$: Observable<number> = this.contactId.asObservable().pipe(
        filter((contactId: number) => !!contactId)
    );
    contactGroupId: BehaviorSubject<string> = new BehaviorSubject<string>(null);
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
    toolbarSubject$ = this.toolbarSubject.asObservable();
    isPrevDisabled = false;
    isNextDisabled = false;
    prev: Subject<any> = new Subject();
    next: Subject<any> = new Subject();

    constructor(injector: Injector,
        private appService: AppService,
        private contactProxy: ContactServiceProxy,
        private leadService: LeadServiceProxy,
        private invoiceProxy: InvoiceServiceProxy,
        private documentProxy: DocumentServiceProxy,
        private emailTemplateProxy: EmailTemplateServiceProxy,
        private communicationProxy: ContactCommunicationServiceProxy,
        private permission: AppPermissionService,
        private userService: UserServiceProxy,
        private notifyService: NotifyService,
        private ls: AppLocalizationService,
        private router: Router,
        private cacheHelper: CacheHelper,
        private cacheService: CacheService,
        private contactPhotoServiceProxy: ContactPhotoServiceProxy,
        public dialog: MatDialog
    ) {}

    private subscribe(sub, ident: string = 'common') {
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
        return this.subscribe(this.toolbarSubject$.subscribe(callback), ident);
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

    closeSettingsDialog(storeInCache: boolean = true) {
        if (storeInCache)
            this.cacheService.set(this.settingsDialogOpenedCacheKey, false);
        this.settingsDialogOpened.next(false);
    }

    toggleSettingsDialog() {
        if (this.settingsDialogOpened.value)
            this.closeSettingsDialog();
        else
            this.openSettingsDialog();
    }

    contactInfoSubscribe(callback, ident?: string) {
        return this.subscribe(this.contactInfo.asObservable().subscribe(callback), ident);
    }

    contactInfoUpdate(contactInfo?: ContactInfoDto) {
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

    cleanLastContact() {
        this.contactId.next(null);
        this.contactInfoUpdate();
        this.leadInfoUpdate();
    }

    addCompanyDialog(event, contactInfo: ContactInfoDto, shiftX?, shiftY?): Observable<CreatePersonOrgRelationOutput> {
        this.dialog.closeAll();
        event.stopPropagation();

        let leadInfo = this.leadInfoSubject.getValue();
        const dialogData: AddCompanyDialogData = {
            leadId: leadInfo && leadInfo.id,
            contactId: contactInfo.id,
            contactInfo: contactInfo,
            updateLocation: this.updateLocation.bind(this)
        };
        return this.dialog.open(AddCompanyDialogComponent, {
            data: dialogData,
            hasBackdrop: false,
            position: DialogService.calculateDialogPosition(
                event, event.target, shiftX, shiftY
            )
        }).afterClosed().pipe(
            tap(response => {
                if (response && response.organizationId)
                    setTimeout(() => this.invalidateUserData(), 300);
            })
        );
    }

    showUploadPhotoDialog(companyId: number, companyPhoto: string, event, maintainAspectRatio?: boolean): Observable<any> {
        event.stopPropagation();
        const uploadPhotoData: UploadPhotoData = {
            title: this.ls.l('ChangeCompanyLogo'),
            source: companyPhoto ? 'data:image/jpeg;base64,' + companyPhoto : null,
            maintainAspectRatio: maintainAspectRatio,
            maxSizeBytes: AppConsts.maxImageSize
        };
        return this.dialog.open(UploadPhotoDialogComponent, {
            data: uploadPhotoData,
            maxWidth: AppConsts.maxImageDialogWidth,
            hasBackdrop: true
        }).afterClosed().pipe(
            filter(Boolean),
            switchMap((result: UploadPhotoResult) => {
                let action$: Observable<string>;
                if (result.clearPhoto) {
                    action$ = this.contactPhotoServiceProxy.clearContactPhoto(companyId).pipe(
                        mapTo(null)
                    );
                } else {
                    let base64OrigImage = StringHelper.getBase64(result.origImage);
                    let base64ThumbImage = StringHelper.getBase64(result.thumbImage);
                    action$ = this.contactPhotoServiceProxy.createContactPhoto(
                        CreateContactPhotoInput.fromJS({
                            contactId: companyId,
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

    getContactInfo(contactId): Observable<ContactInfoDto> {
        let contactInfo = this.contactProxy['data'] &&
            this.contactProxy['data'].contactInfo;
        return contactInfo && contactInfo.id == contactId ? of(contactInfo)
            : this.contactProxy.getContactInfo(contactId);
    }

    initSuggestionEmails(emailData, title: string) {
        if (emailData.contact) {
            emailData.contactId = emailData.contact.id;
            emailData.suggestionEmails = emailData.contact.personContactInfo.details.emails
                .filter(item => item.isActive).map(item => item.emailAddress);

            if (emailData.suggestionEmails.length && ['Reply', 'ReplyToAll', 'Forward', 'Resend'].indexOf(title) < 0) {
                emailData.to = [emailData.suggestionEmails[0]];
            }

            emailData.contact.personContactInfo.details.phones
                .filter(item => item.usageTypeId == 'F' && item.isActive) //Home Fax
                .map(item => emailData.suggestionEmails.push(item.phoneNumber + '@fax.clicksend.com'));
        }
    }

    initEmailDialogTagsList(dialogComponent: EmailTemplateDialogComponent) {
        if (!dialogComponent.tagsList || !dialogComponent.tagsList.length) {
            dialogComponent.tagsList = this.getEmailTemplateTags(dialogComponent.data.templateType);
        }
    }

    getEmailTemplateTags(templateType: EmailTemplateType) : any[] {
        switch (templateType) {
            case EmailTemplateType.Contact:
                return [
                    EmailTags.FirstName, EmailTags.LastName, EmailTags.SenderFullName, EmailTags.DayOfWeek, EmailTags.LastReferralContact, EmailTags.CompanyIndustry,
                    EmailTags.SenderPhone, EmailTags.SenderEmail, EmailTags.SenderWebSite1,
                    EmailTags.SenderWebSite2, EmailTags.SenderWebSite3, EmailTags.SenderCompany,
                    EmailTags.SenderCompanyTitle, EmailTags.SenderCompanyLogo, EmailTags.SenderCompanyPhone,
                    EmailTags.SenderCompanyEmail, EmailTags.SenderCompanyWebSite, EmailTags.SenderCalendly,
                    EmailTags.SenderAffiliateCode, EmailTags.SenderEmailSignature, EmailTags.SubscribeLink, EmailTags.UnsubscribeLink
                ];
            case EmailTemplateType.Invoice:
                return [
                    EmailTags.ClientFirstName, EmailTags.ClientLastName, EmailTags.LegalName, EmailTags.InvoiceNumber, EmailTags.InvoiceGrandTotal, EmailTags.InvoiceDueDate, 
                    EmailTags.InvoiceLink, EmailTags.InvoicePayLink, EmailTags.InvoiceAnchor, EmailTags.SenderFullName, EmailTags.SenderPhone, EmailTags.SenderEmail,
                    EmailTags.SenderWebSite1, EmailTags.SenderWebSite2, EmailTags.SenderWebSite3, EmailTags.SenderCompany, EmailTags.SenderCompanyTitle, EmailTags.SenderCompanyLogo,
                    EmailTags.SenderCompanyPhone, EmailTags.SenderCompanyEmail, EmailTags.SenderCompanyWebSite, EmailTags.SenderCalendly, EmailTags.SenderAffiliateCode, EmailTags.SenderEmailSignature,
                    EmailTags.SubscribeLink, EmailTags.UnsubscribeLink
                ];
            case EmailTemplateType.WelcomeEmail:
                return [
                    WelcomeEmailTags.FirstName, WelcomeEmailTags.LastName, WelcomeEmailTags.UserEmail, WelcomeEmailTags.Password, WelcomeEmailTags.BaseUrl, WelcomeEmailTags.SenderSystemName,
                    WelcomeEmailTags.SenderEmailSignature, WelcomeEmailTags.AutologinLink, WelcomeEmailTags.TrackingPixel
                ];
            case EmailTemplateType.ProductPaid:
                return [
                    ProductEmailTags.ClientFullName, ProductEmailTags.ProductName, ProductEmailTags.ProductDescription, ProductEmailTags.ProductQuantity, ProductEmailTags.ProductSubscriptionOption,
                    ProductEmailTags.ProductInvoiceUrl, ProductEmailTags.ProductReceiptUrl
                ];
            default:
                return [];
        }
    }

    showEmailTemplateDialog(templateId?: number): EmailTemplateDialogComponent {
        const addMode = !templateId;
        let dialogComponent = this.dialog.open(EmailTemplateDialogComponent, {
            panelClass: 'slider',
            disableClose: true,
            closeOnNavigation: false,
            data: {
                templateId: templateId,
                title: addMode ? this.ls.l('Add Template') : this.ls.l('Edit Template'),
                templateType: EmailTemplateType.Contact,
                saveTitle: this.ls.l('Save'),
                hideContextMenu: addMode,
                addMode: addMode
            }
        }).componentInstance;
        this.initEmailDialogTagsList(dialogComponent);
        dialogComponent.templateEditMode = true;
        dialogComponent.onSave.subscribe(() => {
            dialogComponent.close();
        });
        return dialogComponent;
    }

    showEmailDialog(data: any = {}, title = 'Email', onTemplateChange?: (templateId: number, dialogComponent: EmailTemplateDialogComponent) => Observable<void>): Observable<number> {
        let emailData: EmailTemplateData = {
            saveTitle: this.ls.l('Send'),
            title: this.ls.l(title),
            hideContextMenu: true,
            ...data
        };

        if (!emailData.templateType)
            emailData.templateType = EmailTemplateType.Contact;
        if (emailData.contact)
            this.initSuggestionEmails(emailData, title);
        else if (emailData['contactId'])
            this.getContactInfo(emailData['contactId']).subscribe((contactInfo: ContactInfoDto) => {
                emailData.contact = contactInfo;
                this.initSuggestionEmails(emailData, title);
            });

        let dialogComponent = this.dialog.open(EmailTemplateDialogComponent, {
            panelClass: 'slider',
            disableClose: true,
            closeOnNavigation: false,
            data: emailData
        }).componentInstance;

        if (emailData.templateType == EmailTemplateType.Contact)
            dialogComponent.onTemplateCreate.subscribe((templateId: number) => {
                const emailTemplateDialog = this.showEmailTemplateDialog(templateId);
                emailTemplateDialog.onSave.subscribe((data: EmailTemplateData) => {
                    dialogComponent.data.templateId = data.templateId;
                    dialogComponent.onTemplateChanged({ value: data.templateId });
                    dialogComponent.refresh();
                });
                emailTemplateDialog.onTemplateDelete.subscribe((templateId: number) => {
                    if (dialogComponent.data.templateId === templateId) {
                        dialogComponent.data.templateId = null;
                        dialogComponent.reset();
                        dialogComponent.invalidate();
                    }
                });
            });

        dialogComponent.onTemplateChange.pipe(
            switchMap((templateId: number) => {
                dialogComponent.startLoading();

                let dataLoader$: Observable<any>;
                if (onTemplateChange)
                    dataLoader$ = onTemplateChange(templateId, dialogComponent);
                else {
                    if (data.contactIds)
                        dataLoader$ = this.emailTemplateProxy.getTemplate(templateId).pipe(map(res => {
                            return <GetEmailDataOutput>{
                                subject: res.subject,
                                cc: res.cc,
                                bcc: res.bcc,
                                previewText: res.previewText,
                                body: res.body,
                                attachments: res.attachments
                            };
                        }));
                    else
                        dataLoader$ = this.communicationProxy.getEmailData(templateId, emailData['contactId'])

                    dataLoader$ = dataLoader$.pipe(
                        map((data: GetEmailDataOutput) => {
                            if (emailData.cc && emailData.cc.length)
                                data.cc = [].concat(data.cc, emailData.cc);
                            if (emailData.bcc && emailData.bcc.length)
                                data.bcc = [].concat(data.bcc, emailData.bcc);

                            Object.assign(emailData, data);
                            dialogComponent.updateTemplateAttachments(data.attachments);
                        })
                    );
                }

                return dataLoader$.pipe(
                    finalize(() => dialogComponent.finishLoading())
                );
            })
        ).subscribe(() => dialogComponent.invalidate());

        this.initEmailDialogTagsList(dialogComponent);
        return dialogComponent.onSave.pipe(
            switchMap((res: any) => {
                dialogComponent.startLoading();
                if (res.attachments) {
                    res.attachments = res.attachments.map(item => {
                        return new FileInfo({
                            id: item.fileId || item.id,
                            name: item.name
                        });
                    });
                }
                return data.contactIds ? 
                    this.sendBulkEmail(res, () => {dialogComponent.finishLoading()}) :
                    this.sendEmail(res, () => {dialogComponent.finishLoading()});
            }),
            tap((res: number) => {
                if (data.contactIds && !res || !isNaN(res)) {
                    this.notifyService.info(this.ls.l('MailSent'));
                    dialogComponent.close();
                }
            })
        );
    }

    showEmailTemplateSelectorDialog(templateId, templateType: EmailTemplateType, saveCallback: (data) => void) {
        let dialogComponent = this.dialog.open(EmailTemplateDialogComponent, {
            panelClass: 'slider',
            disableClose: true,
            closeOnNavigation: false,
            data: {
                templateId: templateId,
                title: this.ls.l('Template'),
                templateType: templateType
            }
        }).componentInstance;
        dialogComponent.templateEditMode = true;
        dialogComponent.tagsList = this.getEmailTemplateTags(templateType);
        dialogComponent.onSave.subscribe((data) => {
            if (data && saveCallback)
                saveCallback(data)
        });

        if (templateType == EmailTemplateType.Invoice) {
            dialogComponent.onTagItemClick.subscribe((tag: string) => {
                if (tag == 'InvoiceAnchor')
                    dialogComponent.addLinkTag('InvoiceLink', this.ls.l('Invoice'));
                else
                    dialogComponent.addTextTag(tag);
            });
        }

        return dialogComponent;
    }

    sendBulkEmail(input: IBulkSendEmailInput, finalizeMethod: () => void): Observable<any> {
        return new Observable<any>((observer) => {
            this.communicationProxy.bulkEmailSend(new BulkSendEmailInput(input)).pipe(
                finalize(() => finalizeMethod())
            ).subscribe(() => {
                observer.next();
            }, err => {observer.next(err)});
        });
    }

    sendEmail(input: ISendEmailInput, finalizeMethod: () => void): Observable<number> {
        return new Observable<number>((observer) => {
            this.communicationProxy.sendEmail(new SendEmailInput(input)).pipe(
                finalize(() => finalizeMethod())
            ).subscribe(res => {
                observer.next(res);
            }, err => {observer.next(err)});
        });
    }

    sendSMS(input: ISendSMSInput) {
        return this.communicationProxy.sendSMS(new SendSMSInput(input)).pipe(
            catchError(error => of(error))
        );
    }

    showInvoiceEmailDialog(invoiceId: number, data: any = {}) {
        data.templateType = EmailTemplateType.Invoice;
        return this.showEmailDialog(data, 'Email', (tmpId: number, dialogComponent: EmailTemplateDialogComponent) => {
            return this.invoiceProxy.getEmailData(tmpId, invoiceId).pipe(
                map((email: GetEmailDataOutput) => {
                    let emailData = dialogComponent.data;
                    if (emailData.cc && emailData.cc.length)
                        data.cc = [].concat(data.cc, emailData.cc);
                    if (emailData.bcc && emailData.bcc.length)
                        data.bcc = [].concat(data.bcc, emailData.bcc);

                    Object.assign(emailData, email);
                    dialogComponent.updateTemplateAttachments(email.attachments);
                })
            );
        });
    }

    showNoteAddDialog(noteData?: NoteInfoDto) {
        let dialogId = 'note' + (noteData && noteData.id || ''),
            dialog = this.dialog.getDialogById(dialogId);
        if (dialog && (!noteData || dialog.componentInstance.data.note.id == noteData.id))
            return ;
        else
            this.dialog.closeAll();

        forkJoin(
            this.contactInfo$.pipe(filter(Boolean), first()),
            this.personContactInfo$.pipe(filter(Boolean), first()),
            this.organizationContactInfo$.pipe(filter(Boolean), first()),
            this.leadInfo$.pipe(filter(Boolean), first(), map((leadInfo: LeadInfoDto) => leadInfo.propertyId))
        ).subscribe(([contactInfo, personContactInfo, organizationContactInfo, propertyId]:
            [ContactInfoDto, PersonContactInfoDto, OrganizationContactInfoDto, number]
        ) => {
            const noteAddDialogData: NoteAddDialogData = {
                note: noteData,
                contactInfo: contactInfo,
                propertyId: propertyId,
                contactsService: this
            };
            this.dialog.open(NoteAddDialogComponent, {
                id: dialogId,
                panelClass: ['slider'],
                hasBackdrop: false,
                closeOnNavigation: true,
                data: noteAddDialogData
            }).componentInstance.onSaved.subscribe(() => {
                this.invalidate('notes');
            });
        });
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
        contactGroupId: ContactGroup,
        loadFinalize = () => {},
        keepSource = true,
        keepTarget = true
    ) {
        return this.contactProxy.getContactInfoForMerge(
            sourceInfo.id, sourceInfo.leadId,
            targetInfo.id, targetInfo.leadId,
            String(contactGroupId)
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
                    keepTarget: keepTarget,
                    contactGroupId: contactGroupId
                }
            }).afterClosed();
        }));
    }

    showTemplateDocumentsDialog(
        contactId: number, invalidate: () => void,
        showDocuments: boolean = false, fullHeight: boolean = false,
        title?: string, showUploadTab: boolean = true
    ) {
        const templateDocumentsDialogData: TemplateDocumentsDialogData = {
            contactId: contactId,
            fullHeight: fullHeight,
            showUpload: showUploadTab,
            showDocuments: showDocuments,
            invalidate: invalidate,
            title: title
        };
        return this.dialog.open(TemplateDocumentsDialogComponent, {
            id: 'template-documents-dialog',
            panelClass: ['slider'],
            hasBackdrop: false,
            closeOnNavigation: true,
            data: templateDocumentsDialogData
        });
    }

    showUploadDocumentsDialog(contactId: number, title?: string) {
        this.showTemplateDocumentsDialog(
            contactId, () => this.invalidate('documents'), false, false, title
        ).afterClosed().subscribe(files => {
            if (files && files.length) {
                abp.ui.setBusy();
                this.documentProxy.copyTemplate(new CopyTemplateInput({
                    contactId: contactId,
                    files: files.map(item => {
                        return new FileInfo({
                            id: item.key.split('_').shift(),
                            name: item.name
                        });
                    })
                })).pipe(
                    finalize(() => abp.ui.clearBusy())
                ).subscribe(() => {
                    this.invalidate('documents');
                });
            }
        });
    }

    deleteContact(customerName, contactGroups: ContactGroup[], entityId, callback?, isLead = false, userId?) {
        let text = this.ls.l('LeadDeleteWarningMessage', customerName);
        let canForceDelete = this.permission.isGranted(AppPermissions.CRMForceDeleteEntites);
        if (isLead) {
            ContactsHelper.showConfirmMessage(
                text,
                (isConfirmed: boolean, [ forceDelete ]: boolean[]) => {
                    if (isConfirmed) {
                        this.leadService.deleteLead(entityId, forceDelete).subscribe(() => {
                            abp.notify.success(this.ls.l('SuccessfullyDeleted'));
                            this.contactProxy['data']['deleted'] = true;
                            callback && callback();
                        });
                    }
                },
                [ { text: this.ls.l('ForceDelete'), visible: canForceDelete, checked: false }]
            );
        } else {
            let text = contactGroups.some(group => group == ContactGroup.Partner) ? 
                this.ls.l('PartnerDeleteWarningMessage', customerName) : this.ls.l('ContactDeleteWarningMessage', customerName);
            ContactsHelper.showConfirmMessage(
                text,
                (isConfirmed: boolean, [ forceDelete, notifyUser ]: boolean[]) => {
                    if (isConfirmed) {
                        this.contactProxy.deleteContact(entityId, forceDelete, notifyUser).subscribe(() => {
                            abp.notify.success(this.ls.l('SuccessfullyDeleted'));
                            callback && callback();
                        });
                    }
                },
                [
                    { text: this.ls.l('ForceDelete'), visible: canForceDelete, checked: false },
                    { text: this.ls.l('SendCancellationEmail'), visible: !!(userId === undefined ? this.userId.value : userId), checked: false }
                ]
            );
        }
    }

    mergeContact(source, target, contactGroupId: ContactGroup, keepSource?: boolean, keepTarget?: boolean, callback?, isLead = false) {
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
            contactGroupId,
            () => abp.ui.clearBusy(),
            keepSource,
            keepTarget
        ).subscribe((success: boolean) => {
            if (success && callback)
                callback();
        });
    }

    getSection(queryParams: Params): string {
        if (queryParams) {
            if (queryParams.subId)
                return 'subscriptions';            
            else if (queryParams.referrer)
                return queryParams.referrer.split('/').pop();
        }
        return 'clients';
    }

    getContactGroupId(queryParams: Params): string {
        if (queryParams) {
            if (queryParams.contactGroupId) {
                let contactGroupId = queryParams.contactGroupId.toUpperCase();
                if (Object.keys(ContactGroup).some(group => ContactGroup[group] == contactGroupId))
                    return contactGroupId;
            }

            if (queryParams.referrer) {
                let section = queryParams.referrer.split('/').pop();
                switch (section) {
                    case 'orders':
                    case 'clients':
                    case 'subscriptions':
                        return ContactGroup.Client;
                    case 'partners':
                        return ContactGroup.Partner;
                    case 'users':
                        return ContactGroup.Employee;
                }
            }
        }
    }

    getCurrentItemType(queryParams: Params): ItemTypeEnum {
        let dataSourceURI: ItemTypeEnum;
        switch (this.getSection(queryParams)) {
            case 'leads':
                dataSourceURI = ItemTypeEnum.Lead;
                break;
            case 'clients':
                dataSourceURI = ItemTypeEnum.Customer;
                break;
            case 'partners':
                dataSourceURI = ItemTypeEnum.Partner;
                break;
            case 'users':
                dataSourceURI = ItemTypeEnum.User;
                break;
            case 'orders':
                dataSourceURI = ItemTypeEnum.Order;
                break;
            case 'subscriptions':
                dataSourceURI = ItemTypeEnum.Subscription;
                break;
            default:
                break;
        }
        return dataSourceURI;
    }

    updateStatus(entityId: number, groupId: ContactGroup, isActive: boolean, entity: 'contact' | 'user' = 'contact', showEmailCheckbox = false): Observable<any> {
        return new Observable<any>((observer: Subscriber<any>) => {
            let contactGroupName: any = invert(ContactGroup);
            ContactsHelper.showConfirmMessage(
                this.ls.l(startCase(entity) + 'UpdateStatusWarningMessage', 
                    this.ls.l((isActive ? '': 'in') + 'activate'), 
                    startCase(contactGroupName[<string>groupId])
                ),
                (isConfirmed: boolean, [ notifyUser, processLead ]: boolean[]) => {
                    if (isConfirmed) {
                        this.updateStatusInternal(entityId, groupId, isActive, notifyUser, processLead, entity).subscribe(
                            () => observer.next(true),
                            (error) => observer.error(error)
                        );
                    } else {
                        observer.next(false);
                    }
                },
                [
                    {
                        text: this.ls.l('SendCancellationEmail'),
                        visible: this.userId.value && (entity == 'user' && !isActive || showEmailCheckbox),
                        checked: false
                    },
                    {
                        text: this.ls.l('FinalizeLeadIfNotCompleted'),
                        visible: isActive,
                        checked: true
                    }
                ],
                this.ls.l(startCase(entity) + 'StatusUpdateConfirmationTitle')
            );
        });
    }

    private updateStatusInternal(entityId: number, groupId: ContactGroup, isActive: boolean, notifyUser: boolean, processLead: boolean, entityType: 'contact' | 'user' = 'contact') {
        return entityType === 'contact'
            ? this.contactProxy.updateContactStatus(new UpdateContactStatusInput({
                contactId: entityId,
                groupId: String(groupId),
                isActive: isActive,
                notifyUser: notifyUser,
                processLead: processLead
            }))
            : this.userService.updateOptions(new UpdateUserOptionsDto({
                id: entityId,
                isActive: isActive,
                notifyUser: notifyUser,
                isLockoutEnabled: null,
                isTwoFactorEnabled: null
            }));
    }

    getConfirmedContactText(data: any) {
        let date = data.confirmationDate;
        return this.ls.l('ConfirmedContact') + (
            data.isConfirmed && date ? 
                ' at ' + date.format(AppConsts.formatting.dateMoment) +
                ' by ' + (data.confirmedByUserFullName || this.ls.l('System')) : ''
        );
    }

    getFeatureCount(feature: AppFeatures) {
        return this.appService.getFeatureCount(feature);
    }
}