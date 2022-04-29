  /** Core imports */
import { Component, ChangeDetectionStrategy, ViewChild, OnInit, ElementRef,
    Inject, ChangeDetectorRef, Input, Output, EventEmitter } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

/** Third party imports */
import { Observable, Subject } from 'rxjs';
import { finalize, startWith, switchMap } from 'rxjs/operators';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DxValidationGroupComponent } from 'devextreme-angular';
import { DxSelectBoxComponent } from 'devextreme-angular/ui/select-box';
import { DxValidatorComponent } from 'devextreme-angular/ui/validator';
import { DxScrollViewComponent } from 'devextreme-angular/ui/scroll-view';
import { NgxFileDropEntry } from 'ngx-file-drop';
import startCase from 'lodash/startCase';

/** Application imports */
import { AppService } from '@app/app.service';
import { AppConsts } from '@shared/AppConsts';
import { NotifyService } from 'abp-ng2-module';
import { AppFeatures } from '@shared/AppFeatures';
import { FeatureCheckerService } from 'abp-ng2-module';
import { ProfileService } from '@shared/common/profile-service/profile.service';
import { ModalDialogComponent } from '@shared/common/dialogs/modal/modal-dialog.component';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { IDialogButton } from '@shared/common/dialogs/modal/dialog-button.interface';
import { CacheHelper } from '@shared/common/cache-helper/cache-helper';
import { CacheService } from 'ng2-cache-service';
import {
    EmailTemplateServiceProxy,
    GetTemplatesResponse,
    CreateEmailTemplateRequest,
    ContactCommunicationServiceProxy,
    UpdateEmailTemplateRequest,
    GetTemplateReponse,
    ContactServiceProxy,
    GetEmailDataOutput,
    EmailSettingsSource,
    EmailTemplateType
} from '@shared/service-proxies/service-proxies';
import { DocumentsService } from '@app/crm/contacts/documents/documents.service';
import { PhoneFormatPipe } from '@shared/common/pipes/phone-format/phone-format.pipe';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { TemplateDocumentsDialogComponent } from '@app/crm/contacts/documents/template-documents-dialog/template-documents-dialog.component';
import { EmailTemplateData } from '@app/crm/shared/email-template-dialog/email-template-data.interface';
import { EmailAttachment } from '@app/crm/shared/email-template-dialog/email-attachment';
import { EmailTags } from '@app/crm/contacts/contacts.const';
import { TemplateDocumentsDialogData } from '@app/crm/contacts/documents/template-documents-dialog/template-documents-dialog-data.interface';
import { AppPermissionService } from '@shared/common/auth/permission.service';
import { AppPermissions } from '@shared/AppPermissions';

@Component({
    selector: 'email-template-dialog',
    templateUrl: 'email-template-dialog.component.html',
    styleUrls: [ 'email-template-dialog.component.less' ],
    providers: [ CacheHelper, PhoneFormatPipe, EmailTemplateServiceProxy ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmailTemplateDialogComponent implements OnInit {
    @ViewChild(DxValidationGroupComponent) validationGroup: DxValidationGroupComponent;
    @ViewChild(ModalDialogComponent) modalDialog: ModalDialogComponent;
    @ViewChild(DxSelectBoxComponent) templateComponent: DxSelectBoxComponent;
    @ViewChild(DxValidatorComponent) validator: DxValidatorComponent;
    @ViewChild('scrollView') scrollView: DxScrollViewComponent;
    @ViewChild('tagsButton') tagsButton: ElementRef;

    ckEditor: any;
    templateLoaded: boolean;
    emailSettingsSource: EmailSettingsSource;
    showCC = false;
    showBCC = false;
    tagLastValue: string;
    startCase = startCase;
    tagsTooltipVisible = false;

    private readonly WEBSITE_LINK_TYPE_ID = 'J';

    @Input() tagsList = [];
    @Input() editorHeight;
    @Input() templateEditMode = false;
    @Output() onSave: EventEmitter<EmailTemplateData> = new EventEmitter<EmailTemplateData>();
    @Output() onTemplateCreate: EventEmitter<EmailTemplateData> = new EventEmitter<EmailTemplateData>();
    @Output() onTemplateChange: EventEmitter<number> = new EventEmitter<number>();
    @Output() onTagItemClick: EventEmitter<string> = new EventEmitter<string>();
    @Output() onTemplateDelete: EventEmitter<number> = new EventEmitter<number>();

    isManageUnallowed = !this.permission.isGranted(AppPermissions.CRMSettingsConfigure);
    isSettingsAllowed = this.permission.isGranted(AppPermissions.AdministrationTenantHosts) 
        || (this.appService.isHostTenant ? 
            this.permission.isGranted(AppPermissions.AdministrationHostSettings) :
            this.permission.isGranted(AppPermissions.AdministrationTenantSettings)
    );

    buttons: IDialogButton[];
    _refresh: Subject<null> = new Subject<null>();
    refresh$: Observable<null> = this._refresh.asObservable();
    templates$: Observable<GetTemplatesResponse[]> = this.refresh$.pipe(
        startWith(null),
        switchMap(() => this.emailTemplateProxy.getTemplates(this.data.templateType))
    );
    attachments: Partial<EmailAttachment>[] = this.data.attachments || [];
    uniqId = Math.random().toString().slice(-7);
    charCount: number;
    forceValidationBypass = true;
    emailRegEx = AppConsts.regexPatterns.email;

    storeAttachmentsToDocumentsCacheKey = 'StoreAttachmentsToDocuments';

    ckConfig: any = {
        enterMode: 3, /*CKEDITOR.ENTER_DIV*/
        pasteFilter: null,
        allowedContent: true,
        toolbarCanCollapse: true,
        startupShowBorders: false,
        qtBorder: 0,
        stylesSet: [],
        contentsCss: [],
        toolbar: [
            { name: 'document', items: [ 'Source', '-', 'Preview', 'Templates', '-', 'ExportPdf', 'Print' ] },
            { name: 'clipboard', items: [ 'Cut', 'Copy', 'Paste', 'PasteText', 'PasteFromWord', '-', 'Undo', 'Redo' ] },
            { name: 'editing', items: [ 'Find', 'Replace', '-', 'Scayt' ] },
            { name: 'forms', items: [ 'Form', 'Checkbox', 'Radio', 'TextField', 'Textarea', 'Select', 'Button', 'ImageButton', 'HiddenField' ] },
            '/',
            { name: 'basicstyles', items: [ 'Bold', 'Italic', 'Underline', 'Strikethrough', 'Subscript', 'Superscript', '-', 'CopyFormatting', 'RemoveFormat' ] },
            { name: 'paragraph', items: [ 'NumberedList', 'BulletedList', '-', 'Outdent', 'Indent', '-', 'Blockquote', 'CreateDiv', '-', 'JustifyLeft', 'JustifyCenter', 'JustifyRight', 'JustifyBlock', '-', 'BidiLtr', 'BidiRtl', 'Language' ] },
            { name: 'insert', items: [ 'Image', 'Table', 'HorizontalRule', 'Smiley', 'SpecialChar', 'PageBreak', 'Iframe', 'Mathjax' ] },
            '/',
            { name: 'links', items: [ 'Link', 'Unlink', 'Anchor' ] },
            { name: 'styles', items: [ 'Styles', 'Format', 'Font', 'FontSize' ] },
            { name: 'colors', items: [ 'TextColor', 'BGColor' ] },
            { name: 'tools', items: [ 'Maximize', 'ShowBlocks' ] }
        ],
        removePlugins: 'elementspath',
        extraPlugins: 'preview,colorbutton,font,div,justify,exportpdf,templates,print,pastefromword,pastetext,find,forms,tabletools,showblocks,showborders,smiley,specialchar,pagebreak,iframe,language,bidi,copyformatting',
        skin: 'moono-lisa' //kama,moono,moono-lisa
    };

    saveButtonOptions = [
        { text: this.ls.l('Save'), selected: false },
        { text: this.ls.l('SaveAsNew'), selected: false },
        { text: this.ls.l('SaveAndClose'), selected: false }
    ];

    constructor(
        private phonePipe: PhoneFormatPipe,
        private domSanitizer: DomSanitizer,
        private notifyService: NotifyService,
        private profileService: ProfileService,
        private cacheHelper: CacheHelper,
        private cacheService: CacheService,
        private contactProxy: ContactServiceProxy,
        private dialogRef: MatDialogRef<EmailTemplateDialogComponent>,
        private emailTemplateProxy: EmailTemplateServiceProxy,
        private sessionService: AppSessionService,
        private permission: AppPermissionService,
        private features: FeatureCheckerService,
        private communicationProxy: ContactCommunicationServiceProxy,
        public changeDetectorRef: ChangeDetectorRef,
        public appService: AppService,
        public dialog: MatDialog,
        public ls: AppLocalizationService,
        @Inject(MAT_DIALOG_DATA) public data: EmailTemplateData
    ) {
        if (!data.suggestionEmails)
            data.suggestionEmails = [];

        data.saveAttachmentsToDocuments = this.getAttachmentsToDocumentsCache();
    }

    ngOnInit() {
        if (this.templateEditMode && this.data.templateId)
            this.loadTemplateById(this.data.templateId);
        else {
            if (!this.data.tags && (this.data.contactId || this.data.contact)) {
                this.startLoading();
                this.communicationProxy.getEmailData(
                    undefined, this.data.contactId || this.data.contact.id
                ).pipe(
                    finalize(() => this.finishLoading())
                ).subscribe((res: GetEmailDataOutput) => {
                    this.data.tags = res.tags;
                    if (res.from && res.from.length)
                        this.data.from = res.from;
                    this.initFromField();
                });
            } else
                this.initFromField();
            this.templateLoaded = true;
        }

        delete this.data.attachments;
        this.dialogRef.afterClosed().subscribe(() => {
            if (this.attachments.length && !this.data.attachments)
                this.attachments.forEach(item => this.removeAttachment(item));
        });
        this.showCC = Boolean(this.data.cc && this.data.cc.length);
        this.showBCC = Boolean(this.data.bcc && this.data.bcc.length);

        this.ckConfig.height = this.editorHeight ? this.editorHeight : innerHeight -
            (this.features.isEnabled(AppFeatures.CRMBANKCode) ? 544 : 498) + 'px';

        this.initDialogButtons();
        this.changeDetectorRef.detectChanges();
    }

    initFromField() {
        if (this.data.from instanceof Array && this.data.from.length) {
            let from = this.data.from.find(item => item.emailSettingsSource == EmailSettingsSource.User);
            if (from) {
                this.emailSettingsSource = from.emailSettingsSource;
            } else {
                from = this.data.from[0];
                this.emailSettingsSource = from.emailSettingsSource;
            }
            this.data.emailSettingsSource = this.emailSettingsSource;
            this.checkUpdateCCFromEmail(from);
        }
    }

    checkUpdateCCFromEmail(from) {
        if (this.data.cc && this.data.cc.length)
            this.data.cc = this.data.cc.filter(item => {
                return !(item.includes(from.emailAddress) || from.emailAddress.includes(item));
            });

        if (from && from.ccEmailAddress && this.data.to && this.data.to.every(item => item != from.ccEmailAddress)) {
            if (this.data.cc && this.data.cc.length) {
                this.data.cc.push(from.ccEmailAddress);
                this.data.cc = this.data.cc.map((item, index) => {
                    if (this.data.cc.some((item2, index2) => {
                        if (index2 > index) {
                            let firstItem = item.toLowerCase(),
                                secondItem = item2.toLowerCase();
                            return secondItem.includes(firstItem) 
                                || firstItem.includes(secondItem);
                        }
                        return false;
                    }))
                        return undefined;
                    return item;
                }).filter(Boolean);
            } else
                this.data.cc = [from.ccEmailAddress];
            this.showCC = true;
        }
        this.changeDetectorRef.detectChanges();
    }

    initDialogButtons() {
        this.buttons = [
            {
                id: 'cancelTemplateOptions',
                title: this.ls.l('Cancel'),
                class: 'default',
                action: () => this.close()
            },
            {
                id: 'saveTemplateOptions',
                title: this.data.saveTitle,
                disabled: this.templateEditMode && this.isManageUnallowed,
                class: 'primary',
                action: this.save.bind(this),
                contextMenu: {
                    hidden: this.data.hideContextMenu,
                    items: this.saveButtonOptions,
                    cacheKey: this.cacheHelper.getCacheKey(
                        'save_option_active_index', 'EmailTemplateDialog'),
                    defaultIndex: 0
                },
            }
        ];
    }

    save() {
        if (this.ckEditor.mode == 'source')
            this.ckEditor.execCommand('source');

        setTimeout(() => {
            if (this.validateData()) {
                this.storeAttachmentsToDocumentsCache();
                if (this.templateEditMode)
                    this.saveTemplateData();
                else {
                    this.data.attachments = [];
                    if (this.attachments.every((item: Partial<EmailAttachment>) => {
                        if (item.loader)
                            this.notifyService.info(this.ls.l('AttachmentsUploadInProgress'));
                        else
                            this.data.attachments.push(item);
                        return !item.loader;
                    }))
                        this.onSave.emit(this.data);
                }
            }
        }, 100);
    }

    validateData() {
        if (this.templateEditMode) {
            if (!this.getTemplateName()) {
                this.templateComponent.isValid = false;
                return this.notifyService.error(
                    this.ls.l('RequiredField', this.ls.l('Template')));
            }

            if (this.data.templateType == EmailTemplateType.WelcomeEmail && !this.data.subject)
                return this.notifyService.error(
                    this.ls.l('RequiredField', this.ls.l('Subject')));
        } else {
            let validate = this.validationGroup.instance.validate();
            if (!validate.isValid)
                return validate.brokenRules.forEach(rule => {
                    this.notifyService.error(rule.message);
                });

            if (!this.data.from)
                return this.notifyService.error(
                    this.ls.l('MailerSettingsAreNotConfigured', this.ls.l('SMTP')), 
                    this.ls.l('RequiredField', this.ls.l('From'))
                );

            if (!this.data.to || !this.data.to.length)
                return this.notifyService.error(
                    this.ls.l('RequiredField', this.ls.l('To')));

            if (!this.data.subject)
                return this.notifyService.error(
                    this.ls.l('RequiredField', this.ls.l('Subject')));
        }

        if (!this.data.body)
            return this.notifyService.error(
                this.ls.l('RequiredField', this.ls.l('Body')));

        return true;
    }

    saveTemplateData() {
        this.forceValidationBypass = false;
        if (this.validator.instance.validate().isValid) {
            let data = {
                id: this.data.templateId,
                name: this.getTemplateName(),
                type: this.data.templateType,
                subject: this.data.subject,
                cc: this.data.cc,
                bcc: this.data.bcc,
                previewText: this.data.previewText,
                body: this.data.body
            };

            this.startLoading();
            let request$: Observable<any> = this.data.templateId
                && !this.data.addMode && !this.isSaveAsNew()
                    ? this.emailTemplateProxy.update(new UpdateEmailTemplateRequest(data))
                    : this.emailTemplateProxy.create(new CreateEmailTemplateRequest(data));

            request$.pipe(finalize(() => this.finishLoading())).subscribe((id: number) => {
                if (id)
                    this.data.templateId = id;
                this.onSave.emit(this.data);

                if (this.isSaveAndClose())
                    this.close();
                else
                    this.refresh();
            });
        } else {
            this.templateComponent.instance.option('isValid', false);
        }
        this.forceValidationBypass = true;
    }

    isSaveAsNew() {
        return this.saveButtonOptions.some(item => {
            return item.selected && item.text == this.ls.l('SaveAsNew');
        });
    }

    isSaveAndClose() {
        return this.saveButtonOptions.some(item => {
            return item.selected && item.text == this.ls.l('SaveAndClose');
        });
    }

    getTemplateName() {
        return this.templateComponent.instance.field()['value'];
    }

    refresh() {
        this._refresh.next(null);
    }

    onTagBoxInitialized(event) {
        if (!event.component.option('dataSource') || !event.component.option('dataSource').length)
            event.component.option('openOnFieldClick', false);
    }

    emailInputFocusOut(event, checkDisplay?) {
        event.text = this.tagLastValue || event.event.target.value;
        this.tagLastValue = '';
        this.onCustomItemCreating(event, field => {
            let isComboListEmpty = !this.data[field].length;
            if (checkDisplay && isComboListEmpty
                && !event.component.field().value
            ) {
                if (field == 'cc')
                    this.showCC = false;
                else
                    this.showBCC = false;
                this.changeDetectorRef.detectChanges();
            } else if (field == 'to' && isComboListEmpty)
                event.component.option('isValid', false);
        });
    }

    showInputField(element, field) {
        this[field] = true;
        setTimeout(() =>
            element.instance.focus());
        this.changeDetectorRef.detectChanges();
    }

    startLoading() {
        this.modalDialog && this.modalDialog.startLoading();
    }

    finishLoading() {
        this.modalDialog && this.modalDialog.finishLoading();
    }

    extendDefaultValidator(e) {
        const defaultAdapter = e.component.option('adapter');
        const forceValidationBypass = this.forceValidationBypass;
        const newAdapter = $.extend(
            {},
            defaultAdapter,
            {
                bypass: function() {
                    return forceValidationBypass || this.editor.option('disabled');
                }
            });
        e.component.option('adapter', newAdapter);
    }

    onTemplateChanged(event) {
        if (event.value)
            this.templateComponent.isValid = true;
        this.data.templateId = event.value;
        if (event.value) {
            if (this.templateEditMode)
                this.loadTemplateById(event.value);
            else
                this.onTemplateChange.emit(event.value);
        }
    }

    loadTemplateById(templateId) {
        if (this.templateEditMode) {
            this.startLoading();
            this.emailTemplateProxy.getTemplate(templateId).pipe(
                finalize(() => this.finishLoading())
            ).subscribe((res: GetTemplateReponse) => {
                this.data.bcc = res.bcc;
                this.data.body = res.body;
                this.data.cc = res.cc;
                this.data.subject = res.subject;
                this.data.previewText = res.previewText;
                this.showCC = Boolean(res.cc && res.cc.length);
                this.showBCC = Boolean(res.bcc && res.bcc.length);
                this.onTemplateChange.emit(templateId);
                this.invalidate();
                this.templateLoaded = true;
            });
        }
    }

    validateEmailList(element) {
        return (event) => {
            return element.instance.field() === document.activeElement
                || !event.value || !element.instance.field().value;
        };
    }

    invalidate() {
        this.updateDataLength();
        this.changeDetectorRef.markForCheck();
    }

    onFromChanged(event) {
        let from = this.data.from.find(
            item => item.emailSettingsSource == event.value
        );
        if (from) {
            this.data.emailSettingsSource = from.emailSettingsSource;
            if (this.data.cc && this.data.cc.length)
                this.data.from.forEach(item => {
                    let index = this.data.cc.indexOf(item.ccEmailAddress);
                    if (index >= 0)
                        this.data.cc.splice(index, 1);                    
                });
                this.checkUpdateCCFromEmail(from);
        }
    }

    onCustomItemCreating(event, callback?) {
        let field = event.component.option('name'),
            values = event.text.trim().split(/[,|;]+(?=(?:(?:[^"]*"){2})*[^"]*$)/),
            validValues = [], invalidValues = [],
            currentList = this.data[field];

        values.forEach(item => {
            if (AppConsts.regexPatterns.emailWithName.test(item))
                validValues.push(item);
            else if (item.trim())
                invalidValues.push(item);
        });

        validValues = validValues.filter((item, pos) => {
            return validValues.indexOf(item) == pos &&
                (!currentList || currentList.indexOf(item) < 0);
        });

        if (invalidValues.length) {
            event.component.option('isValid', false);
            setTimeout(() =>
                event.component.field().value = invalidValues.join(','));
        } else
            event.component.option('isValid', true);

        setTimeout(() => {
            if (currentList)
                Array.prototype.push.apply(currentList, validValues);
            else
                this.data[field] = validValues;
            callback && callback(field);
            this.changeDetectorRef.markForCheck();
        });
        event.customItem = '';
    }

    onNewTemplate(event) {
        if (event.text)
            this.templateComponent.isValid = true;
        event.customItem = { name: event.text, id: undefined };
    }

    onTemplateOptionChanged(event) {
        if (event.name == 'selectedItem' && !event.value) {
            this.reset();
            this.changeDetectorRef.detectChanges();
            setTimeout(() => {
                event.component.option('isValid', true);
                event.component.focus();
                this.invalidate();
            });
        }
    }

    reset() {
        this.data.cc = this.data.bcc = [];
        this.data.subject = this.data.body = '';
    }

    onCKReady(event) {
        this.ckEditor = event.editor;
        setTimeout(() => {
            this.ckEditor.container.find('.cke_toolbox').$[0].append(
                this.tagsButton.nativeElement);
            this.tagsButton.nativeElement.style.display = 'inline';
            this.invalidate();
        });
    }

    updateDataLength() {
        this.charCount = Math.max(this.data.body.replace(/(<([^>]+)>|\&nbsp;)/ig, '').length - 1, 0);
        this.changeDetectorRef.markForCheck();
    }

    onTagClick(event) {
        if (this.onTagItemClick.observers.length)
            this.onTagItemClick.emit(event.itemData);
        else if (this.templateEditMode) {
            if (event.itemData == EmailTags.SenderCompanyLogo)
                this.insertImageElement('#' + event.itemData + '#');
            else
                this.addTextTag(event.itemData);
        } else {
            let value = this.getTagValue(event.itemData);
            if (value) {
                if (event.itemData == EmailTags.SenderCompanyLogo) {
                    this.insertImageElement(value);
                } else if (event.itemData == EmailTags.SenderEmailSignature) {
                    this.insertHtml(value);
                } else {
                    this.insertText(value);
                }
            }
        }
        this.tagsTooltipVisible = false;
    }

    getTagValue(name) {
        let value = this.data.tags && this.data.tags[name];
        if (name == EmailTags.SenderPhone && value)
            value = this.phonePipe.transform(value);
        return value;
    }

    getWebsiteLinks(list) {
        return list.filter(item => item.linkTypeId == this.WEBSITE_LINK_TYPE_ID);
    }

    onKeyUp(event) {
        this.tagLastValue = event.event.target.value;
    }

    insertImageElement(src) {
        this.insertHtml('<img src="' + src + '">');
    }

    insertHtml(html: string) {
        this.ckEditor.insertHtml(html);
    }

    insertText(text: string) {
        this.ckEditor.insertText(text);
    }

    addTextTag(tag: string) {
        this.insertText('#' + tag + '#');
    }

    addLinkTag(tag: string, link: string) {
        this.ckEditor.insertHtml('<a href="#' + tag + '#">' + link + '</a>');
    }

    addAttachments(files: NgxFileDropEntry[]) {
        if (files.length) {
            if (this.scrollView) {
                let scroll = this.scrollView.instance;
                setTimeout(() => scroll.scrollTo(
                    scroll.scrollHeight()
                ), 600);
                scroll.update();
            }
            files.forEach((file: NgxFileDropEntry) => {
                if (file.fileEntry)
                    file.fileEntry['file'](this.uploadFile.bind(this));
                else
                    this.uploadFile(file);
            });
            let templateDialog = this.dialog.getDialogById('templateDialog');
            if (templateDialog)
                templateDialog.close();
        }
    }

    removeAttachment(attachment: Partial<EmailAttachment>, index?) {
        if (index != undefined) {
            this.attachments.splice(index, 1);
            this.changeDetectorRef.markForCheck();
        }
        if (attachment.id) {
            if (attachment.hasOwnProperty('loader'))
                this.communicationProxy.deleteAttachment(attachment.id).subscribe();
        } else
            attachment.loader.unsubscribe();
    }

    uploadFile(file) {
        if (file.size > 5 * 1024 * 1024)
            return this.notifyService.warn(this.ls.l('FilesizeLimitWarn', 5));

        let attachment: Partial<EmailAttachment> = {
            name: file.name,
            size: file.size
        };

        attachment.url = this.domSanitizer.bypassSecurityTrustResourceUrl(URL.createObjectURL(file));
        attachment.loader = this.sendAttachment(file).subscribe((res: any) => {
            if (res) {
                if (res.result)
                    attachment.id = res.result;
                else {
                    attachment.progress = res.loaded == res.total ? 0 :
                        Math.round(res.loaded / res.total * 100);
                    this.changeDetectorRef.markForCheck();
                }
            }
        }, res => {
            this.attachments = this.attachments.filter(item => item.name != file.name);
            this.notifyService.error(res.error.message);
            this.changeDetectorRef.markForCheck();
        }, () => {
            attachment.loader = undefined;
        });
        this.attachments.push(attachment);
    }

    sendAttachment(file) {
        return new Observable(subscriber => {
            let xhr = new XMLHttpRequest(),
                formData = new FormData();
            formData.append('file', file);
            xhr.open('POST', AppConsts.remoteServiceBaseUrl + '/api/services/CRM/ContactCommunication/SaveAttachment');
            xhr.setRequestHeader('Authorization', 'Bearer ' + abp.auth.getToken());

            xhr.upload.addEventListener('progress', event => {
                subscriber.next(event);
            });

            xhr.addEventListener('load', () => {
                let responce = JSON.parse(xhr.responseText);
                if (xhr.status === 200)
                    subscriber.next(responce);
                else
                    subscriber.error(responce);
                subscriber.complete();
            });
            xhr.send(formData);
        });
    }

    createTemplate() {
        this.onTemplateCreate.emit();
    }

    editTemplate(data: EmailTemplateData) {
        this.onTemplateCreate.emit(data);
    }

    deleteTemplate(event, template, component) {
        component.instance.option('opened', false);
        abp.message.confirm(this.ls.l('DeleteItemConfirmation', template.name), '', (isConfimed) => {
            if (isConfimed) {
                this.startLoading();
                this.emailTemplateProxy.delete(template.id)
                    .pipe(finalize(() => this.finishLoading()))
                    .subscribe(() => {
                        this.notifyService.success(this.ls.l('SuccessfullyDeleted'));
                        this.refresh();
                        if (this.data.templateId === template.id) {
                            this.data.templateId = null;
                        }
                        this.onTemplateDelete.emit(template.id);
                    });
            }
        });
        event.stopPropagation();
        event.preventDefault();
    }

    openDocuments() {
        const templateDocumentsDialogData: TemplateDocumentsDialogData = {
            fullHeight: true,
            contactId: this.data.contact && this.data.contact.id,
            dropFiles: this.addAttachments.bind(this),
            showDocuments: true
        };
        this.dialog.open(TemplateDocumentsDialogComponent, {
            id: 'templateDialog',
            panelClass: ['slider'],
            hasBackdrop: true,
            closeOnNavigation: true,
            data: templateDocumentsDialogData
        }).afterClosed().subscribe(data => {
            if (data && data.length) {
                this.attachments = this.attachments.concat(
                    data.map(item => {
                        return {
                            id: item.key,
                            name: item.name,
                            size: item.size,
                            progress: 0
                        };
                    })
                );
                this.changeDetectorRef.detectChanges();
            }
        });
    }

    attachmentClick(event, attachment) {
        if (!attachment.url) {
            this.startLoading();
            this.communicationProxy.getAttachmentLink(attachment.id).pipe(
                finalize(() => this.finishLoading())
            ).subscribe(res => window.open(res, '_blank'));
            event.stopPropagation();
            event.preventDefault();
        }
    }

    storeAttachmentsToDocumentsCache() {
        this.cacheService.set(
            this.cacheHelper.getCacheKey(this.storeAttachmentsToDocumentsCacheKey),
            this.data.saveAttachmentsToDocuments
        );
    }

    getAttachmentsToDocumentsCache(): boolean {
        let key = this.cacheHelper.getCacheKey(this.storeAttachmentsToDocumentsCacheKey);
        if (this.cacheService.get(key) == false)
            return false;

        return true;
    }

    close() {
        this.modalDialog.close();
    }
}