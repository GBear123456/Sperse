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
        private emailTemplateProxy: EmailTemplateServiceProxy,
        private changeDetectorRef: ChangeDetectorRef,
        private sessionService: AppSessionService,
        public dialog: MatDialog,
        public ls: AppLocalizationService,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        this.initTemplateList();
        data.from = [sessionService.user.emailAddress];
    }

    save() {
        if (this.validateData()) {
            if (this.templateEditMode)
                this.saveTemplateData();

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
            body: this.data.body,
            emailTemplateParams: this.getEmailTemplateParams()
        };

        this.startLoading();
        (this.data.templateId ?
            this.emailTemplateProxy.update(new UpdateEmailTemplateRequest(data)) :
            this.emailTemplateProxy.create(new CreateEmailTemplateRequest(data))
        ).pipe(finalize(() => this.finishLoading())).subscribe(() => {
            this.notifyService.info(this.ls.l('SavedSuccessfully'));
            this.initTemplateList();
        });
    }

    getTemplateName() {
        return this.templateComponent.instance.field()['value'];
    }

    getEmailTemplateParams(): any[] {
        //TODO: return something
        return [];
    }

    initTemplateList() {  
        this.templates$ = this.emailTemplateProxy.getTemplates(this.data.templateType);
        this.changeDetectorRef.markForCheck();
    }

    emailInputFocusIn(event) {
        event.component.option('opened', false);
    }

    emailInputFocusOut(event, checkDisplay) {
        let inputValue = event.event.target.value,
            comboValue = event.component.option('value') || [];
        if (AppConsts.regexPatterns.email.test(inputValue))
            event.component.option('value', comboValue = comboValue.concat([inputValue]));

        if (checkDisplay && !comboValue.length)
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

    onCustomItemCreating(event) {
        let isValid = AppConsts.regexPatterns.email.test(event.text);
        event.component.option('isValid', isValid);
        return event.customItem = isValid ? event.text : '';
    }

    onNewTemplate(event) {
        event.customItem = {name: event.text, id: undefined};
    }
}
