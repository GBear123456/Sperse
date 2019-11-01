/** Core imports */
import { Component, ChangeDetectionStrategy, ViewChild, OnInit, Inject, ChangeDetectorRef, Input, Output, EventEmitter } from '@angular/core';

/** Third party imports */
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DxSelectBoxComponent } from 'devextreme-angular/ui/select-box';
import { DxTextBoxComponent } from 'devextreme-angular/ui/text-box';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { NotifyService } from '@abp/notify/notify.service';
import { ModalDialogComponent } from '@shared/common/dialogs/modal/modal-dialog.component';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { IDialogButton } from '@shared/common/dialogs/modal/dialog-button.interface';
import { EmailTemplateServiceProxy, GetTemplatesResponse, CreateEmailTemplateRequest,
    UpdateEmailTemplateRequest } from '@shared/service-proxies/service-proxies';
import { AppSessionService } from '@shared/common/session/app-session.service';

@Component({
    selector: 'email-template-dialog',
    templateUrl: 'email-template-dialog.component.html',
    styleUrls: [ 'email-template-dialog.component.less' ],
    providers: [ EmailTemplateServiceProxy ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmailTemplateDialogComponent implements OnInit {
    @ViewChild(ModalDialogComponent) modalDialog: ModalDialogComponent;
    @ViewChild(DxSelectBoxComponent) templateComponent: DxSelectBoxComponent;

    showCC = false;
    showBCC = false;

    ckConfig = {
        toolbarGroups: [
                { name: 'document', groups: [ 'mode', 'document', 'doctools' ] },
                { name: 'editing', groups: [ 'find', 'selection', 'editing' ] },
                { name: 'forms', groups: [ 'forms' ] },
                { name: 'basicstyles', groups: [ 'basicstyles', 'cleanup' ] },
                { name: 'paragraph', groups: [ 'list', 'indent', 'blocks', 'align', 'bidi', 'paragraph' ] },
                { name: 'styles', groups: [ 'styles' ] },
                { name: 'colors', groups: [ 'colors' ] },
                { name: 'clipboard', groups: [ 'clipboard', 'undo' ] }
        ],
        removeButtons: 'Anchor,Subscript,Superscript,Source'
    };

    @Input() templateEditMode = false;
    @Output() onSave: EventEmitter<any> = new EventEmitter<any>();
    @Output() onTemplateChange: EventEmitter<any> = new EventEmitter<any>();

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

    constructor(
        private notifyService: NotifyService,
        private dialogRef: MatDialogRef<EmailTemplateDialogComponent>,
        private emailTemplateProxy: EmailTemplateServiceProxy,
        private changeDetectorRef: ChangeDetectorRef,
        private sessionService: AppSessionService,
        public dialog: MatDialog,
        public ls: AppLocalizationService,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        this.initTemplateList();
        data.from = [sessionService.user.emailAddress];
        if (!data.suggestionEmails)
            data.suggestionEmails = [];
    }

    ngOnInit() {
        this.showCC = this.templateEditMode || this.data.cc && this.data.cc.length;
        this.showBCC = this.templateEditMode || this.data.bcc && this.data.bcc.length;
        this.changeDetectorRef.markForCheck();
    }

    save() {
        if (this.validateData()) {
            if (this.templateEditMode)
                this.saveTemplateData();
            else 
                this.onSave.emit(this.data);
        }
    }

    validateData() {
        if (this.templateEditMode) {
            if (!this.getTemplateName())
                return this.notifyService.error(
                    this.ls.l('RequiredField', '', this.ls.l('Template')));
        } else {
            if (!this.data.from)
                return this.notifyService.error(
                    this.ls.l('RequiredField', '', this.ls.l('From')));

            if (!this.data.to)
                return this.notifyService.error(
                    this.ls.l('RequiredField', '', this.ls.l('To')));

            if (!this.data.subject)
                return this.notifyService.error(
                    this.ls.l('RequiredField', '', this.ls.l('Subject')));
        }

        if (!this.data.body)
            return this.notifyService.error(
                this.ls.l('RequiredField', '', this.ls.l('Body')));

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
        (this.data.templateId ?
            this.emailTemplateProxy.update(new UpdateEmailTemplateRequest(data)) :
            this.emailTemplateProxy.create(new CreateEmailTemplateRequest(data))
        ).pipe(finalize(() => this.finishLoading())).subscribe(id => {
            this.data.templateId = id;
            this.onSave.emit(this.data);
            this.initTemplateList();
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
        event.text = event.event.target.value;           
        this.onCustomItemCreating(event, field => {
            let isComboListEmpty = !this.data[field].length;
            if (!this.templateEditMode && checkDisplay && isComboListEmpty) {
                if (field == 'cc')
                    this.showCC = false;
                else 
                    this.showBCC = false;
            } else if (field == 'to')
                event.component.option('isValid', !isComboListEmpty);
        });
    }

    showInputField(element) {
        let component = element.instance;
        this[component.option('name')] = true;
        setTimeout(() => component.focus());
    }

    startLoading() {
        this.modalDialog.startLoading();
    }

    finishLoading() {
        this.modalDialog.finishLoading();
    }

    onTemplateChanged(event) {
        if (event.value) {
            this.startLoading();
            this.emailTemplateProxy.getTemplate(event.value).pipe(
                finalize(() => this.finishLoading())
            ).subscribe(res => {
                this.data.bcc = res.bcc;
                this.data.body = res.body;
                this.data.cc = res.cc;
                this.data.subject = res.subject;
                this.changeDetectorRef.markForCheck();
                this.onTemplateChange.emit(res);
            });
        }
    }

    onCustomItemCreating(event, callback?) {
        let field = event.component.option('name'),
            values = event.text.split(/[\s,]+/).map(item => 
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
            this.changeDetectorRef.markForCheck();
            callback && callback(field);
        });

        return event.customItem = '';
    }

    onNewTemplate(event) {
        event.customItem = {name: event.text, id: undefined};       
    }

    onTemplateFocusOut(event) {
        event.component.option('isValid', Boolean(this.getTemplateName()));
    }

    onTemplateOptionChanged(event) {
        if (event.name == 'selectedItem' && !event.value) {
            this.data.cc = this.data.bcc = this.data.subject = this.data.body = '';
            setTimeout(() => {
                event.component.option('isValid', true);
                event.component.focus();
            });
        }
    }

    close() {
        this.modalDialog.close();
    }
}
