/** Core imports */
import {
    Component, ChangeDetectionStrategy, ViewChild, OnInit, ElementRef,
    Inject, ChangeDetectorRef, Input, Output, EventEmitter
} from '@angular/core';

/** Third party imports */
import { Observable, Subject } from 'rxjs';
import { finalize, startWith, switchMap, map } from 'rxjs/operators';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { DxSelectBoxComponent } from 'devextreme-angular/ui/select-box';
import { DxScrollViewComponent } from 'devextreme-angular/ui/scroll-view';
import startCase from 'lodash/startCase';

/** Application imports */
import { NotifyService } from '@abp/notify/notify.service';
import { AppFeatures } from '@shared/AppFeatures';
import { FeatureCheckerService } from '@abp/features/feature-checker.service';
import { ModalDialogComponent } from '@shared/common/dialogs/modal/modal-dialog.component';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { IDialogButton } from '@shared/common/dialogs/modal/dialog-button.interface';
import {
    EmailTemplateServiceProxy,
    GetTemplatesResponse,
    CreateEmailTemplateRequest,
    UpdateEmailTemplateRequest,
    GetTemplateReponse,
    EmailTemplateType
} from '@shared/service-proxies/service-proxies';
import { WelcomeEmailTags } from './welcome-email-tags';

@Component({
    selector: 'welcome-email-dialog',
    templateUrl: 'welcome-email-dialog.component.html',
    styleUrls: ['welcome-email-dialog.component.less'],
    providers: [EmailTemplateServiceProxy],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class WelcomeEmailDialogComponent implements OnInit {
    @ViewChild(ModalDialogComponent, { static: false }) modalDialog: ModalDialogComponent;
    @ViewChild(DxSelectBoxComponent, { static: false }) templateComponent: DxSelectBoxComponent;
    @ViewChild('scrollView', { static: false }) scrollView: DxScrollViewComponent;
    @ViewChild('tagsButton', { static: false }) tagsButton: ElementRef;

    ckEditor: any;
    startCase = startCase;
    tagsTooltipVisible = false;
    tagsList = [WelcomeEmailTags.FirstName, WelcomeEmailTags.LastName, WelcomeEmailTags.UserEmail, WelcomeEmailTags.Password, WelcomeEmailTags.AutologinLink, WelcomeEmailTags.TrackingPixel];
    readonly SystemDefaultId = -1;
    disableControls = false;
    loaded = false;

    @Input() editorHeight;
    @Output() onSave: EventEmitter<any> = new EventEmitter<any>();

    buttons: IDialogButton[];
    _refresh: Subject<null> = new Subject<null>();
    refresh$: Observable<null> = this._refresh.asObservable();
    templates$: Observable<GetTemplatesResponse[]> = this.refresh$.pipe(
        startWith(null),
        switchMap(() => this.emailTemplateProxy.getTemplates(EmailTemplateType.WelcomeEmail)),
        map(response => { response.unshift(GetTemplatesResponse.fromJS({ name: 'System Default', id: this.SystemDefaultId })); return response; })
    );
    uniqId = Math.random().toString().slice(-7);
    charCount: number;

    ckConfig: any = {
        allowedContent: true,
        toolbarCanCollapse: true,
        startupShowBorders: false,
        toolbar: [
            { name: 'document', items: ['Source', '-', 'Preview', 'Templates', '-', 'ExportPdf', 'Print'] },
            { name: 'clipboard', items: ['Cut', 'Copy', 'Paste', 'PasteText', 'PasteFromWord', '-', 'Undo', 'Redo'] },
            { name: 'editing', items: ['Find', 'Replace', '-', 'Scayt'] },
            { name: 'forms', items: ['Form', 'Checkbox', 'Radio', 'TextField', 'Textarea', 'Select', 'Button', 'ImageButton', 'HiddenField'] },
            '/',
            { name: 'basicstyles', items: ['Bold', 'Italic', 'Underline', 'Strikethrough', 'Subscript', 'Superscript', '-', 'CopyFormatting', 'RemoveFormat'] },
            { name: 'paragraph', items: ['NumberedList', 'BulletedList', '-', 'Outdent', 'Indent', '-', 'Blockquote', 'CreateDiv', '-', 'JustifyLeft', 'JustifyCenter', 'JustifyRight', 'JustifyBlock', '-', 'BidiLtr', 'BidiRtl', 'Language'] },
            { name: 'insert', items: ['Image', 'Flash', 'Table', 'HorizontalRule', 'Smiley', 'SpecialChar', 'PageBreak', 'Iframe', 'Mathjax'] },
            '/',
            { name: 'links', items: ['Link', 'Unlink', 'Anchor'] },
            { name: 'styles', items: ['Styles', 'Format', 'Font', 'FontSize'] },
            { name: 'colors', items: ['TextColor', 'BGColor'] },
            { name: 'tools', items: ['Maximize', 'ShowBlocks'] }
        ],
        removePlugins: 'elementspath',
        extraPlugins: 'div,preview,colorbutton,font,justify,exportpdf,templates,print,pastefromword,pastetext,find,forms,tabletools,showblocks,showborders,smiley,specialchar,flash,pagebreak,iframe,language,bidi,copyformatting,mathjax',
        skin: 'moono-lisa' //kama,moono,moono-lisa
    };

    constructor(
        private notifyService: NotifyService,
        private emailTemplateProxy: EmailTemplateServiceProxy,
        private features: FeatureCheckerService,
        public changeDetectorRef: ChangeDetectorRef,
        public dialog: MatDialog,
        public ls: AppLocalizationService,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        if (this.data.templateId)
            this.loadTemplateById(this.data.templateId);
        else {
            this.data.templateId = this.SystemDefaultId;
            this.setDisabledControls(true);
            this.loaded = true;
        }
    }

    ngOnInit() {
        this.ckConfig.height = this.editorHeight ? this.editorHeight : innerHeight -
            (this.features.isEnabled(AppFeatures.CRMBANKCode) ? 460 : 420) + 'px';

        this.initDialogButtons();
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
                title: this.ls.l('Save'),
                class: 'primary',
                action: this.save.bind(this)
            }
        ];
    }

    save() {
        if (this.disableControls) {
            this.onSave.emit({ templateId: undefined });
        }
        else if (this.validateData()) {
            this.saveTemplateData();
        }
    }

    validateData() {
        if (!this.getTemplateName())
            return this.notifyService.error(
                this.ls.l('RequiredField', this.ls.l('Template')));

        if (!this.data.body)
            return this.notifyService.error(
                this.ls.l('RequiredField', this.ls.l('Body')));

        if (!this.data.subject)
            return this.notifyService.error(
                this.ls.l('RequiredField', this.ls.l('Subject')));

        return true;
    }

    saveTemplateData() {
        let data = {
            id: this.data.templateId,
            name: this.getTemplateName(),
            type: EmailTemplateType.WelcomeEmail,
            subject: this.data.subject,
            cc: null,
            bcc: null,
            body: this.data.body
        };

        this.startLoading();
        let request$: Observable<any> = this.data.templateId
            ? this.emailTemplateProxy.update(new UpdateEmailTemplateRequest(data))
            : this.emailTemplateProxy.create(new CreateEmailTemplateRequest(data));

        request$.pipe(finalize(() => this.finishLoading())).subscribe((id: number) => {
            if (id)
                this.data.templateId = id;
            this.onSave.emit(this.data);
        });
    }

    getTemplateName() {
        return this.templateComponent.instance.field()['value'];
    }

    refresh() {
        this._refresh.next(null);
    }

    startLoading() {
        this.modalDialog && this.modalDialog.startLoading();
    }

    finishLoading() {
        this.modalDialog && this.modalDialog.finishLoading();
    }

    onTemplateChanged(event) {
        this.data.templateId = event.value;
        if (event.value == this.SystemDefaultId) {
            this.setDisabledControls(true);
            this.clearControlValues();
            return;
        }

        this.setDisabledControls(false);
        if (event.value) {
            this.loadTemplateById(event.value);
        }
    }

    loadTemplateById(templateId) {
        this.startLoading();
        this.emailTemplateProxy.getTemplate(templateId).pipe(
            finalize(() => this.finishLoading())
        ).subscribe((res: GetTemplateReponse) => {
            this.data.body = res.body;
            this.data.subject = res.subject;
            this.loaded = true;
            this.invalidate();
        });
    }

    invalidate() {
        this.updateDataLength();
        this.changeDetectorRef.markForCheck();
    }

    onNewTemplate(event) {
        event.customItem = { name: event.text, id: undefined };
    }

    onTemplateOptionChanged(event) {
        if (event.name == 'selectedItem' && !event.value) {
            this.clearControlValues();
            this.changeDetectorRef.detectChanges();
            setTimeout(() => {
                this.invalidate();
            });
        }
    }

    setDisabledControls(value: boolean) {
        if (this.disableControls == value)
            return;

        this.disableControls = value;
        if (this.ckEditor)
            this.ckEditor.setReadOnly(value);
        else
            this.ckConfig.readOnly = value;
    }

    clearControlValues() {
        this.data.subject = '';
        this.data.body = '';
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
        this.addTextTag(event.itemData);
        this.tagsTooltipVisible = false;
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

    deleteTemplate(e, templateId: number) {
        this.startLoading();
        this.emailTemplateProxy.delete(templateId)
            .pipe(finalize(() => this.finishLoading()))
            .subscribe(() => {
                this.notifyService.success(this.ls.l('SuccessfullyDeleted'));
                this.refresh();
                if (this.data.templateId === templateId) {
                    this.data.templateId = this.SystemDefaultId;
                }
            });
        e.stopPropagation();
        e.preventDefault();
    }

    close() {
        this.modalDialog.close();
    }
}