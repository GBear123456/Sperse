/** Core imports */
import { Component, ChangeDetectionStrategy, ViewChild, Inject, ChangeDetectorRef, Input, Output, EventEmitter } from '@angular/core';

/** Third party imports */
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DxSelectBoxComponent } from 'devextreme-angular/ui/select-box';
import { DxTextBoxComponent } from 'devextreme-angular/ui/text-box';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { NotifyService } from '@abp/notify/notify.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { IDialogButton } from '@shared/common/dialogs/modal/dialog-button.interface';
import { EmailTemplatesServiceProxy, GetTemplatesResponse, CreateEmailTemplateRequest,
    UpdateEmailTemplateRequest, EmailTemplateParamDto } from '@shared/service-proxies/service-proxies';

@Component({
    selector: 'email-template-dialog',
    templateUrl: 'email-template-dialog.component.html',
    styleUrls: [ 'email-template-dialog.component.less' ],
    providers: [ EmailTemplatesServiceProxy ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmailTemplateDialogComponent {
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
            action: () => this.dialogRef.close()
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
        private emailTemplatesProxy: EmailTemplatesServiceProxy,
        private changeDetectorRef: ChangeDetectorRef,
        public dialog: MatDialog,
        public ls: AppLocalizationService,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        this.initTemplateList();
    }

    save() {
        if (this.validateData()) {
            if (this.templateEditMode)
                this.saveTemplateData();

            this.onSave.emit(this.data);
        }
    }

    validateData() {
        if (this.templateEditMode && !this.getTemplateName())
            return this.notifyService.error(
                this.ls.l('RequiredField', '', this.ls.l('Template')));

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
            body: this.data.body,
            emailTemplateParams: this.getEmailTemplateParams()
        };

        this.startLoading();
        (this.data.templateId ?
            this.emailTemplatesProxy.updateTemplate(new UpdateEmailTemplateRequest(data)) :
            this.emailTemplatesProxy.createTemplate(new CreateEmailTemplateRequest(data))
        ).pipe(finalize(() => this.finishLoading())).subscribe(() => {
            this.notifyService.info(this.ls.l('SavedSuccessfully'));
            this.initTemplateList();
        });
    }

    getTemplateName() {
        return this.templateComponent.instance.field()['value'];
    }

    getEmailTemplateParams(): EmailTemplateParamDto[] {
        return this.data.templateSettings.map(item => {
            return new EmailTemplateParamDto({
                key: item.key,
                value: String(item.value)
            });
        });
    }

    initTemplateList() {  
        this.templates$ = this.emailTemplatesProxy.getTemplates(this.data.templateType);
        this.changeDetectorRef.markForCheck();
    }

    emailInputFocusIn(event) {
        event.component.option('opened', false);
    }

    emailInputFocusOut(event) {
        if (!event.component.option('value'))
            this[event.component.option('name')] = false;
    }

    showInputField(element) {
        let component = element.instance;
        this[component.option('name')] = true;
        setTimeout(() => component.focus());
    }

    startLoading() {
        abp.ui.setBusy(this.dialogRef.id);
    }

    finishLoading() {
        abp.ui.clearBusy(this.dialogRef.id);
    }

    onTemplateChanged(event) {
        if (event.value) {
            this.startLoading();
            this.emailTemplatesProxy.getTemplate(event.value).pipe(
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

    onCustomItemCreating(event) {
        let isValid = AppConsts.regexPatterns.email.test(event.text);
        event.component.option('isValid', isValid);
        return event.customItem = isValid ? event.text : '';
    }

    onNewTemplate(event) {
        event.customItem = {name: event.text, id: undefined};
    }
}