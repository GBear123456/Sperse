/** Core imports */
import {
    Component, ChangeDetectionStrategy, ViewChild, OnInit, ElementRef,
    Inject, ChangeDetectorRef, Input, Output, EventEmitter
} from '@angular/core';
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
    EmailFromInfo,
    EmailTemplateServiceProxy,
    GetTemplatesResponse,
    CreateEmailTemplateRequest,
    ContactCommunicationServiceProxy,
    UpdateEmailTemplateRequest,
    GetTemplateReponse,
    ContactServiceProxy,
    GetEmailDataOutput,
    EmailSettingsSource,
    EmailTemplateType,
    FileInfo,
    Attachment
} from '@shared/service-proxies/service-proxies';
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
    styleUrls: ['email-template-dialog.component.less'],
    providers: [CacheHelper, PhoneFormatPipe, EmailTemplateServiceProxy],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmailTemplateDialogComponent implements OnInit {
    @ViewChild(DxValidationGroupComponent) validationGroup: DxValidationGroupComponent;
    @ViewChild(ModalDialogComponent) modalDialog: ModalDialogComponent;
    @ViewChild(DxSelectBoxComponent) templateComponent: DxSelectBoxComponent;
    @ViewChild(DxValidatorComponent) validator: DxValidatorComponent;
    @ViewChild('scrollView') scrollView: DxScrollViewComponent;
    //@ViewChild('tagsButton') tagsButton: ElementRef;
    @ViewChild('aiButton') aiButton: ElementRef;

    ckEditor: any;
    templateLoaded: boolean;
    fromDataSource: EmailFromInfo[] = [];
    showCC = false;
    showBCC = false;
    tagLastValue: string;
    tagsTooltipVisible = false;
    aiTooltipVisible = false;

    private readonly WEBSITE_LINK_TYPE_ID = 'J';

    @Input() tagsList = [];
    @Input() editorHeight;
    @Input() templateEditMode = false;
    @Output() onSave: EventEmitter<EmailTemplateData> = new EventEmitter<EmailTemplateData>();
    @Output() onTemplateCreate: EventEmitter<number> = new EventEmitter<number>();
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
        enterMode: 3, /* CKEDITOR.ENTER_DIV */
        pasteFilter: null,
        toolbarLocation: 'bottom',
        allowedContent: true,
        toolbarCanCollapse: true,
        startupShowBorders: false,
        qtBorder: 0,
        stylesSet: [],
        contentsCss: [],
        toolbar: [
            { name: 'document', items: ['Templates', '-', 'ExportPdf', 'Print'] }, // Removed 'Preview'
            { name: 'clipboard', items: ['Cut', 'Copy', 'Paste', 'PasteText', 'PasteFromWord', '-', 'Undo', 'Redo'] },
            { name: 'editing', items: ['Find', 'Replace', '-', 'Scayt'] },
            '/',
            { name: 'basicstyles', items: ['Bold', 'Italic', 'Underline', 'Strikethrough', 'Subscript', 'Superscript', '-', 'CopyFormatting', 'RemoveFormat'] },
            { name: 'paragraph', items: ['NumberedList', 'BulletedList', '-', 'Outdent', 'Indent', '-', 'Blockquote', 'CreateDiv', '-', 'JustifyLeft', 'JustifyCenter', 'JustifyRight', 'JustifyBlock'] },
            '/',
            { name: 'insert', items: ['Image', 'Table', 'HorizontalRule', 'Smiley', 'SpecialChar', 'PageBreak', 'Iframe', 'Mathjax'] },
            { name: 'links', items: ['Link', 'Unlink', 'Anchor'] },
            { name: 'styles', items: ['Styles', 'Format', 'Font', 'FontSize'] },
            { name: 'colors', items: ['TextColor', 'BGColor'] },
            { name: 'tools', items: ['Maximize', 'ShowBlocks'] }
        ],
        removePlugins: 'elementspath',
        extraPlugins: 'preview,colorbutton,font,div,justify,exportpdf,templates,print,pastefromword,pastetext,find,forms,tabletools,showblocks,showborders,smiley,specialchar,pagebreak,iframe,language,bidi,copyformatting',
        skin: 'moono-lisa' // kama, moono, moono-lisa
    };
    

    saveButtonOptions = [
        { text: this.ls.l('Save'), selected: false },
        { text: this.ls.l('SaveAsNew'), selected: false },
        { text: this.ls.l('SaveAndClose'), selected: false }
    ];
    lastSelectedTemplateId: number;
    customItem: any;

    aiList = [
        { id: 1, name: 'Fix Formatting Issues', disabled: false },
        { id: 2, name: 'Summarize Text', disabled: true },
        { id: 3, name: 'Paraphrase Text', disabled: true },
        { id: 4, name: 'Grammar and Spell Check', disabled: true }
    ];


    filteredItems: any[] = [];
    aiModels: any[] = [];
    dataRecord = { modelId: null };

    selectedItemId: string | null = null;
    bankCodeEnabled = this.features.isEnabled(AppFeatures.CRMBANKCode);

    showNewEmailTab = true;
    showHtmlEditor = false;
    showTemplate = false;
    selectedTab: string = 'new-email';

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
                this.communicationProxy.getEmailData(undefined, this.data.contactId || this.data.contact.id)
                .pipe(finalize(() => this.finishLoading())).subscribe((res: GetEmailDataOutput) => {
                    this.data.tags = res.tags;
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
            (this.features.isEnabled(AppFeatures.CRMBANKCode) ? 544 : 400) + 'px';

        this.initDialogButtons();
        this.aiModels = [
            {
                id: '1',
                name: 'GPT-4o',
                icon: `openai.png`,
                enabled: true,
            },
            {
                id: '2',
                name: 'GPT-4 Mini',
                icon: `openai.png`,
                enabled: true,
            },
            {
                id: '3',
                name: 'GPT-4 Turbo',
                icon: `openai.png`,
                enabled: true,
            },
            {
                id: '5',
                name: 'GPT-4',
                icon: `openai.png`,
                enabled: true,
            },
            {
                id: '6',
                name: 'Claude 3.5 Sonnet',
                icon: `claude.png`,
                enabled: false,
            },
            {
                id: '7',
                name: 'Claude 3 Opus',
                icon: `claude.png`,
                enabled: false,
            },
            {
                id: '8',
                name: 'Claude 3 Haiku',
                icon: `claude.png`,
                enabled: false,
            },
            {
                id: '9',
                name: 'Gemini 1.5 Pro',
                icon: `gemini.png`,
                enabled: false,
            },
            {
                id: '10',
                name: 'Gemini 1.5 Flash',
                icon: `gemini.png`,
                enabled: false,
            },
        ];

        this.filteredItems = [...this.aiModels];
        this.changeDetectorRef.detectChanges();
    }

    getSanitizedIcon(icon: string) {
        return this.domSanitizer.bypassSecurityTrustHtml(icon);
    }

    filterItems(event: Event): void {
        const searchTerm = (event.target as HTMLInputElement).value.toLowerCase();
        this.filteredItems = this.aiModels.filter((item) => item.name.toLowerCase().includes(searchTerm));
    }

    selectItem(item: any): void {
        this.selectedItemId = item.id;
        this.dataRecord.modelId = item.id;
    }

    initFromField() {
        let storageKey = 'SupportedFrom' + this.sessionService.userId,
            supportedFrom: any = sessionStorage.getItem(storageKey);
        if (supportedFrom)
            this.initFromDataSource(JSON.parse(supportedFrom));
        else
            this.communicationProxy.getSupportedEmailFromAddresses().subscribe((fromEmails: EmailFromInfo[]) => {
                sessionStorage.setItem(storageKey, JSON.stringify(fromEmails));
                this.initFromDataSource(fromEmails);
            });
    }

    initFromDataSource(fromEmails: EmailFromInfo[]) {
        if (fromEmails && fromEmails.length)
            this.fromDataSource = fromEmails;
        else if (this.data.from)
            this.fromDataSource = this.data.from instanceof Array ?
                this.data.from : [this.data.from];
        if (this.fromDataSource.length) {
            let from = this.fromDataSource.find(item => item.emailSettingsSource == EmailSettingsSource.User) || this.fromDataSource[0];
            this.data.emailSettingsSource = from.emailSettingsSource;
            if (!this.data.isResend)
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
            // {
            //     id: 'cancelTemplateOptions',
            //     title: this.ls.l('Cancel'),
            //     class: 'default',
            //     action: () => this.close()
            // },
            {
                id: 'genrateAIOptions',
                title: this.ls.l('Generate'),
                class: 'ai-genrate-btn',
              //  action: () => this.close()
            },
            {
                id: 'saveTemplateOptions',
                title: "Send Email Message",// this.data.saveTitle,
                disabled: this.templateEditMode && this.isManageUnallowed,
                class: 'primary',
                action: this.save.bind(this),
                contextMenu: {
                    hidden: this.data.hideContextMenu,
                    items: this.saveButtonOptions,
                    cacheKey: this.cacheHelper.getCacheKey('save_option_active_index', 'EmailTemplateDialog'),
                    defaultIndex: 0
                },
            },
            // {
            //     id: 'refreshOptions',
            //     title: '',
            //     class: 'refresh-button',
            //     action: () => this.close()
            // },
        ];
    }

    save() {
        if (this.ckEditor.mode == 'source')
            this.ckEditor.execCommand('source');

        setTimeout(() => {
            if (this.validateData()) {
                this.storeAttachmentsToDocumentsCache();
                this.data.attachments = [];
                if (this.attachments.every((item: Partial<EmailAttachment>) => {
                    if (item.loader)
                        this.notifyService.info(this.ls.l('AttachmentsUploadInProgress'));
                    else
                        this.data.attachments.push(item);
                    return !item.loader;
                }))
                    if (this.templateEditMode)
                        this.saveTemplateData();
                    else {
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

            if (!this.fromDataSource.length)
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
            let attachments = [];
            if (this.data.attachments) {
                attachments = this.data.attachments.map(item => {
                    return new FileInfo({
                        id: item.fileId || item.id,
                        name: item.name
                    });
                });
            }

            let templateId = this.data.templateId || this.lastSelectedTemplateId,
                isUpdating = templateId && !this.data.addMode && !this.isSaveAsNew(),
                data = {
                    id: isUpdating ? templateId : undefined,
                    name: this.getTemplateName(),
                    type: this.data.templateType,
                    subject: this.data.subject,
                    cc: this.data.cc,
                    bcc: this.data.bcc,
                    previewText: this.data.previewText,
                    body: this.data.body,
                    attachments: attachments
                };

            this.startLoading();
            let request$: Observable<any> = isUpdating
                ? this.emailTemplateProxy.update(new UpdateEmailTemplateRequest(data))
                : this.emailTemplateProxy.create(new CreateEmailTemplateRequest(data));

            request$.pipe(finalize(() => this.finishLoading())).subscribe((id: number) => {
                if (id) {
                    this.data.templateId = id;
                    if (this.customItem)
                        this.customItem.id = id;
                }
                this.data.attachments.map(item => {
                    item.fromTemplate = true;
                    delete item.loader;
                });
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
                bypass: function () {
                    return forceValidationBypass || this.editor.option('disabled');
                }
            });
        e.component.option('adapter', newAdapter);
    }

    onTemplateChanged(event) {
        if (event.value)
            this.templateComponent.isValid = true;
        if (this.data.templateId = event.value)
            this.customItem = undefined;
        if (event.value) {
            if (this.templateEditMode)
                this.loadTemplateById(event.value);
            else
                this.onTemplateChange.emit(event.value);
        }
    }

    loadTemplateById(templateId) {
        if (!this.templateEditMode)
            return;

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
            this.updateTemplateAttachments(res.attachments);

            this.onTemplateChange.emit(templateId);
            this.invalidate();
            this.templateLoaded = true;
        });
    }

    updateTemplateAttachments(templateAttachments: Attachment[]) {
        this.removeTemplateAttachments();

        if (!templateAttachments)
            return;

        this.attachments = this.attachments.concat(
            templateAttachments.map(item => {
                return <EmailAttachment>{
                    id: item.id,
                    name: item.name,
                    size: item.size,
                    progress: 0,
                    fromTemplate: true
                };
            }));
    }

    removeTemplateAttachments() {
        this.attachments = this.attachments.filter(v => !v.fromTemplate);
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
        let from = this.fromDataSource.find(
            item => item.emailSettingsSource == event.value
        );
        if (from) {
            if (this.data.cc && this.data.cc.length)
                this.fromDataSource.forEach(item => {
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
        this.lastSelectedTemplateId = this.data.templateId;
        if (event.text)
            this.templateComponent.isValid = true;
        this.customItem =
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
        this.removeTemplateAttachments();
    }

    onCKReady(event) {
        this.ckEditor = event.editor;
        setTimeout(() => {
            // this.ckEditor.container.find('.cke_toolbox').$[0].append(
            //     this.tagsButton.nativeElement);
            // this.tagsButton.nativeElement.style.display = 'inline';
            // Append the aiButton right after the tagsButton
            //this.tagsButton.nativeElement.after(this.aiButton.nativeElement);
           // this.invalidate();
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

        if (!value && this.data.contactIds)
            value = '#' + name + '#';

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
        } else {
            attachment.loader.unsubscribe();
            attachment.xhr.abort();
        }
    }

    uploadFile(file) {
        if (file.size > 5 * 1024 * 1024)
            return this.notifyService.warn(this.ls.l('FilesizeLimitWarn', 5));

        let attachment: Partial<EmailAttachment> = {
            name: file.name,
            size: file.size
        };

        attachment.url = this.domSanitizer.bypassSecurityTrustResourceUrl(URL.createObjectURL(file));
        attachment.loader = this.sendAttachment(file, attachment).subscribe((res: any) => {
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
            this.changeDetectorRef.markForCheck();
        });
        this.attachments.push(attachment);
    }

    sendAttachment(file, attachment) {
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
            attachment.xhr = xhr;
            xhr.send(formData);
        });
    }

    createTemplate() {
        this.onTemplateCreate.emit();
    }

    editTemplate(data: EmailTemplateData) {
        this.onTemplateCreate.emit(data.templateId);
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
                            id: item.key.split('_')[0],
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

    getTagText(data: EmailTags) {
        if (data == EmailTags.InvoiceLink)
            return 'Invoice PDF Link';
        return startCase(data);
    }

    close() {
        this.modalDialog.close();
    }

    //Ai- Button related code changes
    getAiItemText(data: any): string {
        return data.name;
    }

    onAiItemClick(event: any): void {
        // this._aigService.getAIResponse(this.data.body).subscribe((result) => {
        //     this.data.body = result;
        //     this.invalidate();
        // });
        this.aiTooltipVisible = false;
    }

    //Ai Option 
    showAIOption = false;
    processing = false;
    editorContent: string = `<p>Consectetur adipiscing elit, <strong>sed do eiusmod</strong> tempor incididunt ut labore et dolore.</p>
<ul class="styled-list">
    <li>
        <strong>Customer Name and Business:</strong>
        <div class="list-content">John Doe, <br> ABC Enterprises Inc.</div>
    </li>
    <li>
        <strong>Purpose of the email:</strong>
        <div class="list-content">Request for a product quotation and availability confirmation for upcoming projects.</div>
    </li>
    <li>
        <strong>Prior communications:</strong>
        <div class="list-content">Follow-up on the meeting held on October 5th regarding the new partnership opportunities.</div>
    </li>
    <li>
        <strong>Tone of the email:</strong>
        <div class="list-content">Professional, courteous, and concise with an emphasis on collaboration.</div>
    </li>
    <li>
        <strong>Styling Preferences:</strong>
        <div class="list-content">Use a formal business format with a clean, minimal design, and company branding colors.</div>
    </li>
    <li>
        <strong>Specific details to include:</strong>
        <div class="list-content">Deadline for the response, contact person details, and required specifications of the product.</div>
    </li>
</ul>
<div class="email-instructions">
    <span><strong>The email must include:</strong></span>
    <ol>
        <li class="list-content pb-2">A clear subject line indicating the purpose of the email</li>
        <li class="list-content pb-2">A brief introduction and context for the communication</li>
        <li class="list-content pb-2">A call to action with a specific deadline for the response</li>
    </ol>
    </div>`;

    openAIOptionDiv() {
        this.showAIOption = true;
    }

    closeAIOptionDiv() {
        this.showAIOption = false;
    }

    onContentChange(event: any) {
        this.editorContent = event.target.innerHTML;
        this.invalidate();
    }

    onPaste(event: ClipboardEvent): void {
        event.preventDefault();
        const pasteContent = event.clipboardData?.getData('text/plain');
        document.execCommand('insertText', false, pasteContent);
        this.editorContent = (event.target as HTMLElement).innerText;
        this.invalidate();
    }

    getChatGptResponse() {
        this.processing = true;
        const content = this.editorContent;
        const apiKey = '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';
        const headers = new Headers({
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        });

        const body = JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: 'You are an expert email marketer. Your task is to create compelling email content based on user input.' },
                { role: 'user', content: content }
            ],
            max_tokens: 4096,
            temperature: 0.5,
            top_p: 1
        });
        const url = 'https://api.openai.com/v1/chat/completions';
        fetch(url, { method: 'POST', headers: headers, body: body })
            .then(response => response.json())
            .then(data => {
                console.log('ChatGPT Response:', data);
                const gptResponse = data.choices[0].message.content;
                var formatedHtml = this.formatEmailContent(gptResponse) as unknown as string;
                this.data.body = formatedHtml;
                this.invalidate();
                this.processing = false;
            })
            .catch(error => {
                this.processing = false;
                console.error('Error calling ChatGPT API:', error);
            });
    }

    formatEmailContent(response: string): string {
        const formattedResponse = response.replace(/\n/g, '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        const updateHtmlRes = formattedResponse.replace(/^```html/, '').replace(/^```/, '').replace(/```$/, '');
        return updateHtmlRes.toString().replace('SafeValue must use [property]=binding', '').replace(/<div[^>]*>(\s|&nbsp;)*<\/div>/g, '');
    }

    showTabs(tabName: string) {
        this.selectedTab = tabName;
        this.showNewEmailTab = false;
        this.showHtmlEditor = false;
        this.showTemplate = false;
        if (tabName == 'new-email') {
            this.showNewEmailTab = true;
        }
        else if (tabName == 'html-editor') {
            this.showHtmlEditor = true;
        }
        else if (tabName == 'template') {
            this.showTemplate = true;
        }
    }
    updateEditor(): void {
        // Triggered when textarea content changes
    }

}