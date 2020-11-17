  /** Core imports */
import { Component, ChangeDetectionStrategy, ViewChild, OnInit, ElementRef,
    Inject, ChangeDetectorRef, Input, Output, EventEmitter } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

/** Third party imports */
import { Observable, Subject } from 'rxjs';
import { finalize, startWith, switchMap } from 'rxjs/operators';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DxSelectBoxComponent } from 'devextreme-angular/ui/select-box';
import { DxTextAreaComponent } from 'devextreme-angular/ui/text-area';
import { DxValidatorComponent } from 'devextreme-angular/ui/validator';
import { DxScrollViewComponent } from 'devextreme-angular/ui/scroll-view';
import { NgxFileDropEntry } from 'ngx-file-drop';
import startCase from 'lodash/startCase';
import * as ClassicEditor from 'ckeditor5-custom';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { NotifyService } from '@abp/notify/notify.service';
import { ProfileService } from '@shared/common/profile-service/profile.service';
import { ModalDialogComponent } from '@shared/common/dialogs/modal/modal-dialog.component';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { IDialogButton } from '@shared/common/dialogs/modal/dialog-button.interface';
import {
    EmailTemplateServiceProxy,
    GetTemplatesResponse,
    CreateEmailTemplateRequest,
    ContactCommunicationServiceProxy,
    UpdateEmailTemplateRequest,
    GetTemplateReponse,
    ContactServiceProxy,
    GetEmailDataOutput
} from '@shared/service-proxies/service-proxies';
import { DocumentsService } from '@app/crm/contacts/documents/documents.service';
import { PhoneFormatPipe } from '@shared/common/pipes/phone-format/phone-format.pipe';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { TemplateDocumentsDialogComponent } from '@app/crm/contacts/documents/template-documents-dialog/template-documents-dialog.component';
import { EmailTemplateData } from '@app/crm/shared/email-template-dialog/email-template-data.interface';
import { EmailAttachment } from '@app/crm/shared/email-template-dialog/email-attachment';
import { EmailTags } from '@app/crm/contacts/contacts.const';

@Component({
    selector: 'email-template-dialog',
    templateUrl: 'email-template-dialog.component.html',
    styleUrls: [ 'email-template-dialog.component.less' ],
    providers: [ PhoneFormatPipe, EmailTemplateServiceProxy ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmailTemplateDialogComponent implements OnInit {
    @ViewChild(ModalDialogComponent, { static: false }) modalDialog: ModalDialogComponent;
    @ViewChild(DxSelectBoxComponent, { static: false }) templateComponent: DxSelectBoxComponent;
    @ViewChild(DxTextAreaComponent, { static: false }) htmlComponent: DxTextAreaComponent;
    @ViewChild(DxValidatorComponent, { static: false }) validator: DxValidatorComponent;
    @ViewChild('scrollView', { static: false }) scrollView: DxScrollViewComponent;
    @ViewChild('tagsButton', { static: false }) tagsButton: ElementRef;
    @ViewChild('preview', { static: false }) preview: ElementRef;

    Editor = ClassicEditor;
    ckEditor: any;
    showCC = false;
    showBCC = false;
    tagLastValue: string;
    startCase = startCase;
    tagsTooltipVisible = false;
    insertAsHTML = false;

    get isComplexTemplate(): Boolean {
        return this.data && this.data.body && this.data.body.indexOf('<html') >= 0;
    }

    private readonly WEBSITE_LINK_TYPE_ID = 'J';

    @Input() tagsList = [];
    @Input() templateEditMode = false;
    @Output() onSave: EventEmitter<EmailTemplateData> = new EventEmitter<EmailTemplateData>();
    @Output() onTemplateCreate: EventEmitter<EmailTemplateData> = new EventEmitter<EmailTemplateData>();
    @Output() onTemplateChange: EventEmitter<number> = new EventEmitter<number>();
    @Output() onTagItemClick: EventEmitter<number> = new EventEmitter<number>();
    @Output() onTemplateDelete: EventEmitter<number> = new EventEmitter<number>();

    buttons: IDialogButton[] = [
        {
            id: 'cancelTemplateOptions',
            title: this.ls.l('Cancel'),
            class: 'default',
            action: () => this.close()
        },
        {
            id: 'saveTemplateOptions',
            title: this.data.saveTitle,
            class: 'primary',
            action: this.save.bind(this),
            contextMenu: {
                hidden: this.data.hideContextMenu,
                items: [
                    { text: this.ls.l('Save'), selected: false },
                    { text: this.ls.l('SaveAsNew'), selected: false }
                ],
                defaultIndex: 0
            }
        }
    ];
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

    constructor(
        private phonePipe: PhoneFormatPipe,
        private domSanitizer: DomSanitizer,
        private notifyService: NotifyService,
        private profileService: ProfileService,
        private contactProxy: ContactServiceProxy,
        private dialogRef: MatDialogRef<EmailTemplateDialogComponent>,
        private emailTemplateProxy: EmailTemplateServiceProxy,
        private sessionService: AppSessionService,
        private communicationProxy: ContactCommunicationServiceProxy,
        private documentsService: DocumentsService,
        public changeDetectorRef: ChangeDetectorRef,
        public dialog: MatDialog,
        public ls: AppLocalizationService,
        @Inject(MAT_DIALOG_DATA) public data: EmailTemplateData
    ) {
        data.from = sessionService.user.emailAddress;
        if (!data.suggestionEmails)
            data.suggestionEmails = [];

        if (this.data.templateId)
            this.loadTemplateById(this.data.templateId);
        else if (!this.data.tags && this.data.contact)
            this.communicationProxy.getEmailData(
                undefined, this.data.contact.id
            ).subscribe((res: GetEmailDataOutput) => {
                this.data.tags = res.tags;
            });
    }

    ngOnInit() {
        delete this.data.attachments;
        this.dialogRef.afterClosed().subscribe(() => {
            if (this.attachments.length && !this.data.attachments)
                this.attachments.forEach(item => this.removeAttachment(item));
        });
        this.showCC = Boolean(this.data.cc && this.data.cc.length);
        this.showBCC = Boolean(this.data.bcc && this.data.bcc.length);
        this.changeDetectorRef.detectChanges();
    }

    save() {
        if (this.validateData()) {
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
    }

    validateData() {
        if (this.templateEditMode) {
            if (!this.getTemplateName())
                return this.notifyService.error(
                    this.ls.l('RequiredField', this.ls.l('Template')));
        } else {
            if (!this.data.from)
                return this.notifyService.error(
                    this.ls.l('RequiredField', this.ls.l('From')));

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
                body: this.data.body
            };

            this.startLoading();
            let request$: Observable<any> = this.data.templateId
            && this.buttons[1].contextMenu.items[0].selected
            && !this.data.addMode
                ? this.emailTemplateProxy.update(new UpdateEmailTemplateRequest(data))
                : this.emailTemplateProxy.create(new CreateEmailTemplateRequest(data));

            request$.pipe(finalize(() => this.finishLoading())).subscribe((id: number) => {
                if (id)
                    this.data.templateId = id;
                this.onSave.emit(this.data);
            });
        } else {
            this.templateComponent.instance.option('isValid', false);
        }
        this.forceValidationBypass = true;
    }

    getTemplateName() {
        return this.templateComponent.instance.field()['value'];
    }

    refresh() {
        this._refresh.next(null);
    }

    emailInputFocusIn(event) {
        if (!event.component.option('dataSource'))
            event.component.option('opened', false);
    }

    emailInputFocusOut(event, checkDisplay?) {
        event.text = this.tagLastValue || event.event.target.value;
        this.tagLastValue = '';
        this.onCustomItemCreating(event, field => {
            let isComboListEmpty = !this.data[field].length;
            if (checkDisplay && isComboListEmpty) {
                if (field == 'cc')
                    this.showCC = false;
                else
                    this.showBCC = false;
                this.changeDetectorRef.detectChanges();
            } else if (field == 'to')
                event.component.option('isValid', !isComboListEmpty);
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
        if (event.value) {
            this.data.templateId = event.value;
            if (this.templateEditMode || this.data.switchTemplate)
                this.loadTemplateById(event.value);
            else
                this.onTemplateChange.emit(event.value);
        }
    }

    loadTemplateById(templateId) {
        this.startLoading();
        this.emailTemplateProxy.getTemplate(templateId).pipe(
            finalize(() => this.finishLoading())
        ).subscribe((res: GetTemplateReponse) => {
            this.data.bcc = res.bcc;
            this.data.body = res.body;
            this.data.cc = res.cc;
            this.data.subject = res.subject;
            this.showCC = Boolean(res.cc && res.cc.length);
            this.showBCC = Boolean(res.bcc && res.bcc.length);
            this.onTemplateChange.emit(templateId);
            this.invalidate();
        });
    }

    invalidate() {
        this.insertAsHTML = false;
        if (this.isComplexTemplate)
            this.initTemplatePreview();
        else {
            this.ckEditor.setData(this.data.body || '');
            this.updateDataLength();
        }
        this.changeDetectorRef.markForCheck();
    }

    onCustomItemCreating(event, callback?) {
        let field = event.component.option('name'),
            values = event.text.split(/[\s,|\s;]+/).map(item =>
                AppConsts.regexPatterns.email.test(item) ? item : ''),
            validValues = values.filter(Boolean),
            currentList = this.data[field];

        validValues = validValues.filter((item, pos) => {
            return validValues.indexOf(item) == pos &&
                (!currentList || currentList.indexOf(item) < 0);
        });

        setTimeout(() => {
            if (currentList)
                Array.prototype.push.apply(currentList, validValues);
            else
                this.data[field] = validValues;
            callback && callback(field);
            this.changeDetectorRef.markForCheck();
        });

        return event.customItem = '';
    }

    onNewTemplate(event) {
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
        this.ckEditor = event.ui.editor;
        setTimeout(() => {
            this.invalidate();
            if (this.tagsButton) {
                let root = this.ckEditor.sourceElement.parentNode,
                    headingElement = root.querySelector('.ck-heading-dropdown');
                root.querySelector('.ck-toolbar__items').insertBefore(
                    this.tagsButton.nativeElement, headingElement);
                headingElement.style.width = '100px';
            }
        }, 1000);
    }

    updateDataLength() {
        this.data.body = this.ckEditor.getData();
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
                if (event.itemData == EmailTags.SenderCompanyLogo)
                    this.insertImageElement(value);
                else
                    this.insertText(value);
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
        this.ckEditor.model.change(writer => {
            writer.insertElement('image', {src: src},
                this.ckEditor.model.document.selection.getFirstPosition());
        });
    }

    insertText(text: string) {
        this.ckEditor.model.change(writer => {
            writer.insertText(text, this.ckEditor.model.document.selection.getFirstPosition());
        });
    }

    addTextTag(tag: string) {
        this.insertText('#' + tag + '#');
    }

    addLinkTag(tag: string, link: string) {
        this.ckEditor.model.change(writer => {
            writer.insertText(link, { linkHref: '#' + tag + '#' },  this.ckEditor.model.document.selection.getFirstPosition());
        });
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
            files.forEach(file => {
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
        if (attachment.id)
            this.communicationProxy.deleteAttachment(attachment.id).subscribe();
        else
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

    showInsertAsHTML() {
        if (this.insertAsHTML = !this.insertAsHTML) {
            this.htmlComponent.instance.option('value', this.data.body);
            setTimeout(() => this.htmlComponent.instance.focus(), 300);
        } else {
            this.data.body = this.htmlComponent.instance.option('value');
            if (this.isComplexTemplate)
                this.initTemplatePreview();
            else {
                this.ckEditor.setData(this.data.body);
                this.updateDataLength();
            }
        }
    }

    initTemplatePreview() {
        let win = this.preview.nativeElement.contentWindow;
        win.document.open();
        win.document.write(this.data.body || '');
        win.document.close();
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

    deleteTemplate(e, templateId: number) {
        this.startLoading();
        this.emailTemplateProxy.delete(templateId)
            .pipe(finalize(() => this.finishLoading()))
            .subscribe(() => {
                this.notifyService.success(this.ls.l('SuccessfullyDeleted'));
                this.refresh();
                if (this.data.templateId === templateId) {
                    this.data.templateId = null;
                }
                this.onTemplateDelete.emit(templateId);
            });
        e.stopPropagation();
        e.preventDefault();
    }

    openDocuments() {
        this.dialog.open(TemplateDocumentsDialogComponent, {
            id: 'templateDialog',
            panelClass: ['slider'],
            hasBackdrop: true,
            closeOnNavigation: true,
            data: {
                fullHeight: true,
                showDocuments: true,
                dropFiles: this.addAttachments.bind(this)
            }
        }).afterClosed().subscribe(data => {
            if (data && data.length) {
                this.attachments = this.attachments.concat(
                    data.map(item => {
                        let attachment = {
                            id: item.key,
                            name: item.name,
                            size: item.size,
                            progress: 0
                        };
                        return attachment;
                    })
                );
                this.changeDetectorRef.detectChanges();
            }
        });
    }

    attachmentClick(event, attachment) {
        if (!attachment.url) {
            this.documentsService.downloadDocument(attachment.id);
            event.stopPropagation();
        }
    }

    close() {
        this.modalDialog.close();
    }
}