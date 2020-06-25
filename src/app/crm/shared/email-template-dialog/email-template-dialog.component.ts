  /** Core imports */
import { Component, ChangeDetectionStrategy, ViewChild, OnInit, ElementRef,
    Inject, ChangeDetectorRef, Input, Output, EventEmitter } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

/** Third party imports */
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DxSelectBoxComponent } from 'devextreme-angular/ui/select-box';
import { NgxFileDropEntry } from 'ngx-file-drop';
import startCase from 'lodash/startCase';
import * as ClassicEditor from 'ckeditor5-custom';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { NotifyService } from '@abp/notify/notify.service';
import { ModalDialogComponent } from '@shared/common/dialogs/modal/modal-dialog.component';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { IDialogButton } from '@shared/common/dialogs/modal/dialog-button.interface';
import { EmailTemplateServiceProxy, GetTemplatesResponse, CreateEmailTemplateRequest, ContactCommunicationServiceProxy,
    UpdateEmailTemplateRequest, GetTemplateReponse } from '@shared/service-proxies/service-proxies';
import { AppSessionService } from '@shared/common/session/app-session.service';
  import { EmailTemplateData } from '@app/crm/shared/email-template-dialog/email-template-data.interface';
  import { EmailAttachment } from '@app/crm/shared/email-template-dialog/email-attachment';

@Component({
    selector: 'email-template-dialog',
    templateUrl: 'email-template-dialog.component.html',
    styleUrls: [ 'email-template-dialog.component.less' ],
    providers: [ EmailTemplateServiceProxy ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmailTemplateDialogComponent implements OnInit {
    @ViewChild(ModalDialogComponent, { static: false }) modalDialog: ModalDialogComponent;
    @ViewChild(DxSelectBoxComponent, { static: false }) templateComponent: DxSelectBoxComponent;
    @ViewChild('tagsButton', { static: false }) tagsButton: ElementRef;

    Editor = ClassicEditor;
    ckEditor: any;
    showCC = false;
    showBCC = false;
    tagLastValue: string;
    startCase = startCase;
    tagsTooltipVisible = false;

    @Input() tagsList = [];
    @Input() templateEditMode = false;
    @Output() onSave: EventEmitter<any> = new EventEmitter<any>();
    @Output() onTemplateChange: EventEmitter<any> = new EventEmitter<number>();
    @Output() onTagItemClick: EventEmitter<any> = new EventEmitter<number>();

    buttons: IDialogButton[] = [
        {
            id: 'cancelTemplateOptions',
            title: this.ls.l('Cancel'),
            class: 'default',
            action: () => this.close()
        }, {
            id: 'saveTemplateOptions',
            title: this.data.saveTitle,
            class: 'primary',
            action: this.save.bind(this)
        }
    ];
    templates$: Observable<GetTemplatesResponse[]>;
    attachments: Partial<EmailAttachment>[] = this.data.attachments || [];
    charCount: number;

    constructor(
        private domSanitizer: DomSanitizer,
        private notifyService: NotifyService,
        private dialogRef: MatDialogRef<EmailTemplateDialogComponent>,
        private emailTemplateProxy: EmailTemplateServiceProxy,
        private sessionService: AppSessionService,
        private communicationProxy: ContactCommunicationServiceProxy,
        public changeDetectorRef: ChangeDetectorRef,
        public dialog: MatDialog,
        public ls: AppLocalizationService,
        @Inject(MAT_DIALOG_DATA) public data: EmailTemplateData
    ) {
        this.initTemplateList();
        data.from = [sessionService.user.emailAddress];
        if (!data.suggestionEmails)
            data.suggestionEmails = [];
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

            if (!this.data.to)
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
        let request$: Observable<any> = this.data.templateId ?
            this.emailTemplateProxy.update(new UpdateEmailTemplateRequest(data)) :
            this.emailTemplateProxy.create(new CreateEmailTemplateRequest(data));

        request$.pipe(finalize(() => this.finishLoading())).subscribe(id => {
            if (id)
                this.data.templateId = id;
            this.onSave.emit(this.data);
        });
    }

    getTemplateName() {
        return this.templateComponent.instance.field()['value'];
    }

    initTemplateList() {
        this.templates$ = this.emailTemplateProxy.getTemplates(this.data.templateType);
        this.changeDetectorRef.markForCheck();
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
        this.modalDialog.startLoading();
    }

    finishLoading() {
        this.modalDialog.finishLoading();
    }

    onTemplateChanged(event) {
        if (event.value) {
            if (this.templateEditMode || this.data.switchTemplate) {
                this.startLoading();
                this.emailTemplateProxy.getTemplate(event.value).pipe(
                    finalize(() => this.finishLoading())
                ).subscribe((res: GetTemplateReponse) => {
                    this.data.bcc = res.bcc;
                    this.data.body = res.body;
                    this.data.cc = res.cc;
                    this.data.subject = res.subject;
                    this.showCC = Boolean(res.cc && res.cc.length);
                    this.showBCC = Boolean(res.bcc && res.bcc.length);
                    this.changeDetectorRef.markForCheck();
                    this.onTemplateChange.emit(event.value);
                });
            } else
                this.onTemplateChange.emit(event.value);
        }
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

    onTemplateFocusOut(event) {
        event.component.option('isValid', Boolean(this.getTemplateName()));
    }

    onTemplateOptionChanged(event) {
        if (event.name == 'selectedItem' && !event.value) {
            this.data.cc = this.data.bcc = [];
            this.data.subject = this.data.body = '';
            setTimeout(() => {
                event.component.option('isValid', true);
                event.component.focus();
            });
        }
    }

    onCKReady(event) {
        this.ckEditor = event.ui.editor;
        setTimeout(() => {
            if (this.data.body)
                this.ckEditor.setData(this.data.body);
            if (this.tagsButton) {
                let root = this.ckEditor.sourceElement.parentNode,
                    headingElement = root.querySelector('.ck-heading-dropdown');
                root.querySelector('.ck-toolbar__items').insertBefore(
                    this.tagsButton.nativeElement, headingElement);
                headingElement.style.width = '100px';
            }
            this.updateDataLength();
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
        else
            this.addTextTag(event.itemData);
        this.tagsTooltipVisible = false;
    }

    onKeyUp(event) {
        this.tagLastValue = event.event.target.value;
    }

    addTextTag(tag: string) {
        this.ckEditor.model.change(writer => {
            writer.insertText('#' + tag + '#', this.ckEditor.model.document.selection.getFirstPosition());
        });
    }

    addLinkTag(tag: string, link: string) {
        this.ckEditor.model.change(writer => {
            writer.insertText(link, { linkHref: '#' + tag + '#' },  this.ckEditor.model.document.selection.getFirstPosition());
        });
    }

    addAttachments(files: NgxFileDropEntry[], scrollView) {
        if (files.length) {
            let scroll = scrollView.instance;
            setTimeout(() => scroll.scrollTo(
                scroll.scrollHeight()
            ));
            scroll.update();
            files.forEach(file => {
                if (file.fileEntry)
                    file.fileEntry['file'](this.uploadFile.bind(this));
                else
                    this.uploadFile(file);
            });
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

    close() {
        this.modalDialog.close();
    }
}