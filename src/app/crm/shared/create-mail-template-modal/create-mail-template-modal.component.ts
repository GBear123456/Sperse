/** Core imports */
import {
    Component,
    OnInit,
    AfterViewInit,
    Inject,
    ViewChild,
    Input,
    Output,
    EventEmitter,
    ElementRef,
    ChangeDetectorRef,
    HostListener
} from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";

/** Third party imports */
import {
    MAT_DIALOG_DATA,
    MatDialogRef,
    MatDialog,
} from "@angular/material/dialog";
import { FeatureCheckerService } from "abp-ng2-module";
import { DxValidatorComponent } from "devextreme-angular/ui/validator";
import { NotifyService } from "abp-ng2-module";
import { DxValidationGroupComponent } from "devextreme-angular";
import { finalize } from "rxjs/operators";
import { NgxFileDropEntry } from "ngx-file-drop";
import { Observable } from "rxjs";
import { DxScrollViewComponent } from "devextreme-angular/ui/scroll-view";
import { FormGroup, FormBuilder } from "@angular/forms";

/** Application imports */
import { AppConsts } from "@shared/AppConsts";
import { ModalDialogComponent } from "@shared/common/dialogs/modal/modal-dialog.component";
import { prompts } from "../email-template-dialog/prompts";
import { AppLocalizationService } from "@app/shared/common/localization/app-localization.service";
import { IDialogButton } from "@shared/common/dialogs/modal/dialog-button.interface";
import { CreateEmailTemplateData } from "./create-mail-template-data.interface";
import { EmailAttachment } from "@app/crm/shared/email-template-dialog/email-attachment";
import { TemplateDocumentsDialogData } from "@app/crm/contacts/documents/template-documents-dialog/template-documents-dialog-data.interface";
import { TemplateDocumentsDialogComponent } from "@app/crm/contacts/documents/template-documents-dialog/template-documents-dialog.component";
import { EmailTags } from "@app/crm/contacts/contacts.const";
import { PhoneFormatPipe } from "@shared/common/pipes/phone-format/phone-format.pipe";

import {
    EmailTemplateServiceProxy,
    CreateEmailTemplateRequest,
    UpdateEmailTemplateRequest,
    ContactCommunicationServiceProxy,
    EmailTemplateType,
    GetTemplateReponse,
    Attachment,
    FileInfo,
    TenantSettingsServiceProxy,
} from "@shared/service-proxies/service-proxies";


@Component({
    selector: "create-mail-template-modal-dialog",
    templateUrl: "./create-mail-template-modal.component.html",
    styleUrls: ["./create-mail-template-modal.component.less"],
    providers: [TenantSettingsServiceProxy, PhoneFormatPipe],
})
export class CreateMailTemplateModalComponent implements OnInit, AfterViewInit {
    @ViewChild(ModalDialogComponent) modalDialog: ModalDialogComponent;
    @ViewChild(DxValidatorComponent) validator: DxValidatorComponent;
    @ViewChild(DxValidationGroupComponent)
    validationGroup: DxValidationGroupComponent;
    @ViewChild("scrollView") scrollView: DxScrollViewComponent;
    @ViewChild("contentEditableDiv")
    contentEditableDiv!: ElementRef<HTMLDivElement>;
    
    // Tag button container references
    @ViewChild("subjectTagsButtonContainer") subjectTagsButtonContainer: ElementRef;
    @ViewChild("previewTagsButtonContainer") previewTagsButtonContainer: ElementRef;
    @ViewChild("tagsButtonContainer") tagsButtonContainer: ElementRef;

    @Output() onSave: EventEmitter<CreateEmailTemplateData> =
        new EventEmitter<CreateEmailTemplateData>();
    modalTitle: string = "Create New Email Template";
    aiModels: any[] = [];
    processing = false;
    templateLoaded = false;
    selectedPromptGroupIndex: number = 0;
    selectedPromptItemIndex: number = 0;
    editorData: string = "<p>This is Template1</p>";
    editorError: string | null = null;
    templateEditMode: boolean = false;
    buttons: IDialogButton[];
    showAIPrompt = false;
    propmtTooltipVisible = false;
    groupedPromptLibrary: any = prompts;
    showAIOption = false;
    aiTooltipVisible = false;
    selectedItemId: string | null = '1';
    dataRecord = { modelId: null };
    previewText: string;
    ckEditor: any;
    charCount: number;
    uniqId = Math.random().toString().slice(-7);
    
    tagsList: any[] = [];
    tagsData: any = {};
    tooltipButtonRight: number = 0;
    tooltipButtonTop: number = 0;
    tooltipPosition: string = 'bottom';
    isTagsTooltipVisible: boolean = false;
    currentFocusedField: string = '';
    currentFocusedElement: any = null;
    
    ckConfig: any = {
        versionCheck: false,
        height: 500,
        enterMode: 3 /* CKEDITOR.ENTER_DIV */,
        pasteFilter: null,
        toolbarLocation: "bottom",
        allowedContent: true,
        toolbarCanCollapse: true,
        startupShowBorders: false,
        qtBorder: 0,
        stylesSet: [],
        contentsCss: [],
        toolbar: [
            {
                name: "document",
                items: ["Templates", "-", "ExportPdf", "Print"],
            }, // Removed 'Preview'
            {
                name: "clipboard",
                items: [
                    "Cut",
                    "Copy",
                    "Paste",
                    "PasteText",
                    "PasteFromWord",
                    "-",
                    "Undo",
                    "Redo",
                ],
            },
            { name: "editing", items: ["Find", "Replace", "-", "Scayt"] },
            "/",
            {
                name: "basicstyles",
                items: [
                    "Bold",
                    "Italic",
                    "Underline",
                    "Strikethrough",
                    "Subscript",
                    "Superscript",
                    "-",
                    "CopyFormatting",
                    "RemoveFormat",
                ],
            },
            {
                name: "paragraph",
                items: [
                    "NumberedList",
                    "BulletedList",
                    "-",
                    "Outdent",
                    "Indent",
                    "-",
                    "Blockquote",
                    "CreateDiv",
                    "-",
                    "JustifyLeft",
                    "JustifyCenter",
                    "JustifyRight",
                    "JustifyBlock",
                ],
            },
            "/",
            {
                name: "insert",
                items: [
                    "Image",
                    "Table",
                    "HorizontalRule",
                    "Smiley",
                    "SpecialChar",
                    "PageBreak",
                    "Iframe",
                    "Mathjax",
                ],
            },
            { name: "links", items: ["Link", "Unlink", "Anchor"] },
            { name: "styles", items: ["Styles", "Format", "Font", "FontSize"] },
            { name: "colors", items: ["TextColor", "BGColor"] },
            { name: "tools", items: ["Maximize", "ShowBlocks"] },
        ],
        removePlugins: "elementspath",
        extraPlugins:
            "preview,colorbutton,font,div,justify,exportpdf,templates,print,pastefromword,pastetext,find,forms,tabletools,showblocks,showborders,smiley,specialchar,pagebreak,iframe,language,bidi,copyformatting",
        skin: "moono-lisa", // kama, moono, moono-lisa
    };
    templateForm: FormGroup;

    attachments: Partial<EmailAttachment>[] = this.data.attachments || [];
    constructor(
        public dialogRef: MatDialogRef<CreateMailTemplateModalComponent>,
        public ls: AppLocalizationService,
        private features: FeatureCheckerService,
        private notifyService: NotifyService,
        private emailTemplateProxy: EmailTemplateServiceProxy,
        private communicationProxy: ContactCommunicationServiceProxy,
        public changeDetectorRef: ChangeDetectorRef,
        public dialog: MatDialog,
        private fb: FormBuilder,
        private domSanitizer: DomSanitizer,
        private tenantSettingsService: TenantSettingsServiceProxy,
        private phonePipe: PhoneFormatPipe,

        @Inject(MAT_DIALOG_DATA) public data: CreateEmailTemplateData,
        @Inject(MAT_DIALOG_DATA) public params: { id?: number; contact?: any; tagsList?: any[]; tags?: any; contactIds?: any[] }
    ) {
        this.data = this.data || {
            title: "",
            previewText: "",
            subject: "",
            body: "",
            type: EmailTemplateType.Contact,
            cc: undefined,
            bcc: undefined,
            attachments: [],
            saveAttachmentsToDocuments: true
        };
        if (this.params.id) {
            this.loadTemplate(this.params.id);
            this.templateEditMode = true;
        } else {
            this.resetForm();
        }
    }
    @HostListener('document:keydown.escape', ['$event'])
    onESC(event: KeyboardEvent) {
        const fullscreen = document.querySelector('.cke_maximized');
        if (fullscreen) {
            event.stopPropagation();
        } else {
            this.dialogRef.close();
        }
    }
    ngOnInit() {
        this.initDialogButtons();
        this.setupCKEditorConfig();
        this.loadTemplateData();
        
        // Initialize tagsList from dialog data
        if (this.params && this.params.tagsList) {
            this.tagsList = this.params.tagsList;
        }
        
        // Load tag data to initialize tagsData
        this.loadTagData();
        
        // Watch for contact changes and refresh tag data
        this.watchContactChanges();
    }

    ngAfterViewInit() {
        // Ensure tags are loaded after view is initialized
        setTimeout(() => {
            if (this.tagsList && this.tagsList.length > 0) {
                this.changeDetectorRef.detectChanges();
            }
            
            // Verify tooltip setup
            this.verifyTooltipSetup();
        }, 100);
    }

    verifyTooltipSetup() {
        const subjectTarget = document.querySelector('.subject-tags-button.id' + this.uniqId);
        const previewTarget = document.querySelector('.preview-tags-button.id' + this.uniqId);
        const ckeditorTarget = document.querySelector('.ckeditor-tags-button.id' + this.uniqId);
        
       
    }

    watchContactChanges() {
        if (this.params.contact) {
        }
    }

  

    loadTagData() {
        // If tagsList is provided from parent component, use it directly
        if (this.params.tagsList && this.params.tagsList.length > 0) {
            this.tagsList = this.params.tagsList;
            this.initializePlaceholderTags();
            return;
        }
        
        if (this.params.contact && this.params.contact.id) {
            this.startLoading();
            this.communicationProxy
                .getEmailData(undefined, this.params.contact.id)
                .pipe(finalize(() => this.finishLoading()))
                .subscribe((res: any) => {
                    if (res && res.tags) {
                        this.tagsData = res.tags;
                        this.changeDetectorRef.detectChanges();
                    } else {
                        this.initializePlaceholderTags();
                    }
                }, (error) => {
                    this.initializePlaceholderTags();
                });
        } else {
            this.initializePlaceholderTags();
        }
    }

    initializePlaceholderTags() {
        this.tagsData = {};
        if (this.tagsList && this.tagsList.length > 0) {
            this.tagsList.forEach(tag => {
                this.tagsData[tag] = `#${tag}#`;
            });
        }
        this.changeDetectorRef.detectChanges();
    }

    setupCKEditorConfig() {
        this.ckConfig.height = 550;
        this.ckConfig.versionCheck = false;
    }

    loadTemplateData() {
        this.params.id
            ? (this.modalTitle = "Edit Email Template")
            : "Create New Email Template";
        
        // Initialize AI models
        this.aiModels = [
            {
                id: "1",
                name: "GPT-4o",
                icon: `openai.png`,
                enabled: true,
                model: "gpt-4o",
            },
            {
                id: "2",
                name: "GPT-4 Mini",
                icon: `openai.png`,
                enabled: true,
                model: "gpt-4-mini",
            },
            {
                id: "3",
                name: "GPT-4 Turbo",
                icon: `openai.png`,
                enabled: true,
                model: "gpt-4-turbo",
            },
            {
                id: "5",
                name: "GPT-4",
                icon: `openai.png`,
                enabled: true,
                model: "gpt-4",
            },
            {
                id: "6",
                name: "Claude 3.5 Sonnet",
                icon: `claude.png`,
                enabled: false,
                model: "claude-3.5-sonnet-20240620",
            },
            {
                id: "7",
                name: "Claude 3 Opus",
                icon: `claude.png`,
                enabled: false,
                model: "claude-3-opus-20240229",
            },
            {
                id: "8",
                name: "Claude 3 Haiku",
                icon: `claude.png`,
                enabled: false,
                model: "claude-3-haiku-20240307",
            },
            {
                id: "9",
                name: "Gemini 1.5 Pro",
                icon: `gemini.png`,
                enabled: false,
                model: "gemini-1.5-pro-latest",
            },
            {
                id: "10",
                name: "Gemini 1.5 Flash",
                icon: `gemini.png`,
                enabled: false,
                model: "gemini-1.5-flash-latest",
            },
        ];
    }

    // Initialize tag button positioning
    initializeTagButtonPositioning() {
        this.tooltipButtonRight = 8;
        this.tooltipButtonTop = 15;
        this.changeDetectorRef.detectChanges();
    }

    onClose(): void {
        this.dialogRef.close();
    }

    initDialogButtons() {
        this.buttons = [
            {
                id: "genrateAIOptions",
                title: "Write with AI",
                class: "ai-genrate-btn",
                action: this.toggleAIPrompt.bind(this),
            },
            {
                id: 'cancelTemplateBtn',
                title: "Save",
                class: "button-layout temp-save-btn ",
                action: this.saveTemplate.bind(this)
            },
            {
                id: 'saveTemplateBtn',
                title: "Cancel",
                class: 'button-layout temp-btn',
                action: this.resetForm.bind(this)
            }
        ];
    }

    loadTemplate(id: number) {
        this.startLoading();
        this.emailTemplateProxy
            .getTemplate(id)
            .pipe(finalize(() => this.finishLoading()))
            .subscribe((res: GetTemplateReponse) => {
                this.data.bcc = res.bcc;
                this.data.body = res.body;
                this.data.attachments = res.attachments;
                this.attachments = res.attachments;
                this.data.cc = res.cc;
                this.data.subject = res.subject;
                this.data.previewText = res.previewText;
                this.data.title = res.name;
                this.invalidate();
                this.templateLoaded = true;
                this.editorData = res.body;
                
                setTimeout(() => {
                    this.initializeTagButtonPositioning();
                }, 200);
                
                this.loadTagData();
            });
    }

    refreshTagData() {
        this.loadTagData();
    }

    updateDataLength() {
        this.templateForm = this.fb.group({
            emailContentBodyTemplate: [this.data.body],
        });
        this.charCount =
            Math.max(
                this.data.body.replace(/(<([^>]+)>|\&nbsp;)/gi, "").length - 1,
                0
            ) ?? 0;
        this.changeDetectorRef.markForCheck();
    }

    invalidate() {
        this.changeDetectorRef.markForCheck();
    }

    // AI prompt functions
    toggleAIPrompt() {
        this.showAIPrompt = !this.showAIPrompt;
    }

    openAIOptionDiv() {
        this.showAIOption = true;
    }

    closeAIOptionDiv() {
        this.showAIOption = false;
    }
    selectedAIItem(item: any): void {
        this.selectedItemId = item.itemData.id;
        this.dataRecord.modelId = item.itemData.id;
        this.aiTooltipVisible = false;
    }
    updateButtons() {
        this.buttons = this.buttons.map((button) => {
            if (button.id === "genrateAIOptions") {
                return {
                    ...button,
                    title: this.processing
                        ? this.ls.l("Generating...")
                        : this.ls.l("Write with AI"),
                };
            }
            return button;
        });
        this.changeDetectorRef.detectChanges();
    }
    generateAIMessage() {
        this.getChatGptResponse();
    }
    getChatGptResponse() {
        this.processing = true;
        this.updateButtons();

        const prompt =
            this.groupedPromptLibrary[this.selectedPromptGroupIndex]?.prompts[
                this.selectedPromptItemIndex
            ]?.prompt;
        const model =
            this.aiModels.find((item: any) => item.id == this.selectedItemId)
                ?.model ?? "gpt-3.5-turbo";

        const payload = {
            model,
            prompt,
            system: 'You are an expert email marketer. Your task is to create compelling email HTML content based on user input.',
        };

        fetch('/.netlify/functions/openai', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        })
        .then(response => response.json())
        .then(data => {
            this.invalidate();
            this.processing = false;

            const gptResponse = data.response;
            const responseData = this.extractContent(gptResponse);
            this.data.subject = responseData.subject;
            this.data.body = this.formatEmailContent(
                responseData.body
            ) as unknown as string;
            this.editorData = this.formatEmailContent(
                responseData.body
            ) as unknown as string;

            this.updateButtons();
        })
        .catch(error => {
            this.processing = false;
            this.updateButtons();
        });
    }
    extractContent(content: any): { subject: string; body: string } {
        const subjectMatch = content.match(/^Subject: (.*?)(?:\n\n|$)/);
        const subject = subjectMatch ? subjectMatch[1] : "";
        const body = content.replace(/^Subject: .*?\n\n/, "");
        return { subject, body };
    }
    formatEmailContent(response: string): string {
        const formattedResponse = response
            .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
        const updateHtmlRes = formattedResponse
            .replace(/^```html/, "")
            .replace(/^```/, "")
            .replace(/```$/, "");
        const htmlRegex = /<html\b[^<]*(?:(?!<\/html>)<[^<]*)*<\/html>/i;
        const match = updateHtmlRes.match(htmlRegex);
        return match
            .toString()
            .replace("SafeValue must use [property]=binding", "")
            .replace(/<div[^>]*>(\s|&nbsp;)*<\/div>/g, "");
    }

    // ckeditor
    onContentChange(event: any) {
        this.editorData = event.target.innerHTML;
        this.invalidate();
    }

    onPaste(event: ClipboardEvent): void {
        event.preventDefault();
        const pasteContent = event.clipboardData?.getData("text/plain");
        document.execCommand("insertText", false, pasteContent);
        this.editorData = (event.target as HTMLElement).innerText;
        this.invalidate();
    }
    onReady(event: any) {
        console.log('CKEditor ready event:', event);
        this.ckEditor = event;
        
        if (this.ckEditor && this.ckEditor.instance) {
            console.log('CKEditor instance available:', this.ckEditor.instance);
            this.ckEditor.instance.on('focus', this.onCKEditorFocus.bind(this));
            this.ckEditor.instance.on('blur', this.onFieldBlur.bind(this, 'ckeditor'));
            this.changeDetectorRef.detectChanges();
        } else if (this.ckEditor) {
            console.log('CKEditor available but no instance:', this.ckEditor);
            // Check if methods are available directly on the ckEditor object
            if (this.ckEditor.insertText || this.ckEditor.insertHtml) {
                console.log('CKEditor methods available directly');
            }
        }
    }

    onChange(event: any) {
        this.updateDataLength();
    }

    saveTemplate() {
        this.data.attachments = [
            ...this.attachments.filter((item) => !item.loader),
        ];
        const isValid = this.validateData();
        if (isValid) {
            if (this.data.attachments.some((item) => item.loader)) {
                this.notifyService.info(
                    this.ls.l("AttachmentsUploadInProgress")
                );
                return;
            }
            this.saveTemplateData();
        }
    }

    validateData(): boolean {
        let validate = this.validationGroup.instance.validate();
        if (!validate.isValid) {
            validate.brokenRules.forEach((rule) => {
                this.notifyService.error(rule.message);
            });
            return false;
        }

        if (!this.data.body || this.data.body.trim() === "") {
            this.editorError = this.ls.l("RequiredField", this.ls.l("Body"));
            this.notifyService.error(
                this.ls.l("RequiredField", this.ls.l("Body"))
            );
            return false;
        } else {
            this.editorError = null;
        }
        return true;
    }

    saveTemplateData() {
        const attachments = (this.data.attachments || [])
            .map((item) => {
                if (!item.id || !item.name) {
                    this.notifyService.warn(
                        this.ls.l("InvalidAttachment", item.name || "Unknown")
                    );
                    return null;
                }
                return new FileInfo({
                    id: item.fileId || item.id,
                    name: item.name,
                });
            })
            .filter((item) => item !== null);
        const templateData = {
            id: this.templateEditMode ? this.params.id : undefined,
            name: this.data.title,
            type: this.data.type ||  EmailTemplateType.Contact,
            subject: this.data.subject,
            previewText: this.data.previewText,
            body: this.data.body,
            attachments: attachments,
            cc: undefined,
            bcc: undefined,
        };

        this.startLoading();

        const request$: Observable<any> = this.templateEditMode
            ? this.emailTemplateProxy.update(
                  new UpdateEmailTemplateRequest(templateData)
              )
            : this.emailTemplateProxy.create(
                  new CreateEmailTemplateRequest(templateData)
              );

        request$.pipe(finalize(() => this.finishLoading())).subscribe({
            next: (response: any) => {
                this.data.attachments = this.data.attachments.map(item => ({
                    ...item,
                    fromTemplate: true,
                    loader: undefined,
                    xhr: undefined,
                    url: undefined
                }));
                this.onSave.emit(this.data);
                this.dialogRef.close(this.data);
                this.notifyService.success(this.ls.l('SuccessfullySaved'));
            },
            error: (error) => {
                let errorMessage = this.ls.l("ErrorSavingTemplate");
                if (error.error?.message) {
                    errorMessage = error.error.message;
                } else if (error.message) {
                    errorMessage = error.message;
                }
                this.notifyService.error(errorMessage);
            },
            complete: () => {
                this.finishLoading();
            },
        });
    }

    startLoading() {
        this.modalDialog && this.modalDialog.startLoading();
    }
    finishLoading() {
        this.modalDialog && this.modalDialog.finishLoading();
    }

    close() {
        this.modalDialog.close();
    }
    isSaveAndClose() {}
    resetForm() {
        if (this.validationGroup) {
            this.validationGroup.instance.reset();
        }
        this.data = {
            title: "",
            previewText: "",
            subject: "",
            body: "",
            id: null,
            type: EmailTemplateType.Contact,
            attachments: [],
            cc: [],
            bcc: [],
            saveAttachmentsToDocuments:true
        };
        this.editorData = "";
        this.editorError = null;
    }
    toggleGroup(group: any) {
        group.expanded = !group.expanded;
    }
    convertTextToHtml(text: string): string {
        return text
            .replace(/• /g, "<li>")
            .replace(/\n\d+\.\s(.*)/g, "<li>$1</li>")
            .replace(/\n/g, "<br>")
            .replace(/<\/li><br>/g, "</li>");
    }
    selectedPromptItem(item: any, groupIndex: number, itemIndex: number) {
        const html = this.convertTextToHtml(item.prompt);
        if (this.contentEditableDiv) {
            this.contentEditableDiv.nativeElement.innerHTML = html;
        }
        this.selectedPromptGroupIndex = groupIndex;
        this.selectedPromptItemIndex = itemIndex;
        this.propmtTooltipVisible = false;
    }
    cancelAIMessage() {
        this.showAIPrompt = false;
    }

    //  attachment functions
    addAttachments(files: NgxFileDropEntry[]) {
        if (files.length) {
            if (this.scrollView) {
                let scroll = this.scrollView.instance;
                setTimeout(() => scroll.scrollTo(scroll.scrollHeight()), 600);
                scroll.update();
            }
            files.forEach((file: NgxFileDropEntry) => {
                if (file.fileEntry)
                    file.fileEntry["file"](this.uploadFile.bind(this));
                else this.uploadFile(file);
            });
            let templateDialog = this.dialog.getDialogById("templateDialog");
            if (templateDialog) templateDialog.close();
        }
    }

    // Remove an attachment
    removeAttachment(attachment: Partial<EmailAttachment>, index?) {
        if (index != undefined) {
            this.attachments.splice(index, 1);
            this.changeDetectorRef.markForCheck();
        }
        if (attachment.id) {
            if (attachment.hasOwnProperty("loader"))
                this.communicationProxy
                    .deleteAttachment(attachment.id)
                    .subscribe();
        } else {
            attachment.loader.unsubscribe();
            attachment.xhr.abort();
        }
    }

    uploadFile(file) {
        if (file.size > 5 * 1024 * 1024)
            return this.notifyService.warn(this.ls.l("FilesizeLimitWarn", 5));

        let attachment: Partial<EmailAttachment> = {
            name: file.name,
            size: file.size,
        };

        attachment.url = this.domSanitizer.bypassSecurityTrustResourceUrl(
            URL.createObjectURL(file)
        );
        attachment.loader = this.sendAttachment(file, attachment).subscribe(
            (res: any) => {
                if (res) {
                    if (res.result) attachment.id = res.result;
                    else {
                        attachment.progress =
                            res.loaded == res.total
                                ? 0
                                : Math.round((res.loaded / res.total) * 100);
                        this.changeDetectorRef.markForCheck();
                    }
                }
            },
            (res) => {
                this.attachments = this.attachments.filter(
                    (item) => item.name != file.name
                );
                this.notifyService.error(res.error.message);
                this.changeDetectorRef.markForCheck();
            },
            () => {
                attachment.loader = undefined;
                this.changeDetectorRef.markForCheck();
            }
        );
        this.attachments.push(attachment);
    }

    sendAttachment(file, attachment) {
        return new Observable((subscriber) => {
            let xhr = new XMLHttpRequest(),
                formData = new FormData();
            formData.append("file", file);
            xhr.open(
                "POST",
                AppConsts.remoteServiceBaseUrl +
                    "/api/services/CRM/ContactCommunication/SaveAttachment"
            );
            xhr.setRequestHeader(
                "Authorization",
                "Bearer " + abp.auth.getToken()
            );

            xhr.upload.addEventListener("progress", (event) => {
                subscriber.next(event);
            });

            xhr.addEventListener("load", () => {
                let responce = JSON.parse(xhr.responseText);
                if (xhr.status === 200) subscriber.next(responce);
                else subscriber.error(responce);
                subscriber.complete();
            });
            attachment.xhr = xhr;
            xhr.send(formData);
        });
    }

    openDocuments() {
        const templateDocumentsDialogData: TemplateDocumentsDialogData = {
            fullHeight: true,
            contactId: this.params.contact && this.params.contact?.id,
            dropFiles: this.addAttachments.bind(this),
            showDocuments: true,
        };
        this.dialog
            .open(TemplateDocumentsDialogComponent, {
                id: "templateDialog",
                panelClass: ["slider"],
                hasBackdrop: true,
                closeOnNavigation: true,
                data: templateDocumentsDialogData,
            })
            .afterClosed()
            .subscribe((data) => {
                if (data && data.length) {
                    this.attachments = this.attachments.concat(
                        data.map((item) => {
                            return {
                                id: item.key.split("_")[0],
                                name: item.name,
                                size: item.size,
                                progress: 0,
                            };
                        })
                    );
                    this.changeDetectorRef.detectChanges();
                }
            });
    }

    // Handle attachment click (e.g., to download or view)
    attachmentClick(event, attachment) {
        if (!attachment.url) {
            this.startLoading();
            this.communicationProxy
                .getAttachmentLink(attachment.id)
                .pipe(finalize(() => this.finishLoading()))
                .subscribe((res) => window.open(res, "_blank"));
            event.stopPropagation();
            event.preventDefault();
        }
    }

    // Update attachments from a template
    updateTemplateAttachments(templateAttachments: Attachment[]) {
        this.removeTemplateAttachments();

        if (!templateAttachments) return;

        this.attachments = this.attachments.concat(
            templateAttachments.map((item) => {
                return <EmailAttachment>{
                    id: item.id,
                    name: item.name,
                    size: item.size,
                    progress: 0,
                    fromTemplate: true,
                };
            })
        );
    }

    removeTemplateAttachments() {
        this.attachments = this.attachments.filter((v) => !v.fromTemplate);
    }

    onPromptTooltipWheel(event: WheelEvent): void {
        event.preventDefault();
        event.stopPropagation();
        
        const tooltipContent = event.currentTarget as HTMLElement;
        if (tooltipContent) {
            const scrollAmount = event.deltaY > 0 ? 30 : -30;
            tooltipContent.scrollTop += scrollAmount;
        }
    }



    onFieldFocus(fieldType: string, event: any) {
        this.currentFocusedField = fieldType;
        this.changeDetectorRef.detectChanges();
    }

    onFieldBlur(fieldType: string, event: any) {
      
    }

    onCKEditorFocus(event: any) {
        this.currentFocusedField = 'ckeditor';
        this.currentFocusedElement = event.target || this.ckEditor?.container?.$;
        this.changeDetectorRef.detectChanges();
    }

    onCKEditorBlur(event: any) {
        setTimeout(() => {
            if (!this.isTagsTooltipVisible) {
                this.currentFocusedField = '';
                this.currentFocusedElement = null;
                this.changeDetectorRef.detectChanges();
            }
        }, 300);
    }

    onCKEditorClick(event: any) {
        if (this.currentFocusedField === 'ckeditor') {
            // Ensure CKEditor is focused when clicked
            if (this.ckEditor && this.ckEditor.instance) {
                this.ckEditor.instance.focus();
            }
            this.changeDetectorRef.detectChanges();
        }
    }

  
    showTagsTooltip(fieldType: string, event: any) {
        this.currentFocusedField = fieldType;
        this.currentFocusedElement = event.target;
        
        this.isTagsTooltipVisible = true;
        this.changeDetectorRef.detectChanges();
    }

    calculateTooltipPosition(fieldType: string, event: any) {
        const targetElement = event.target || event.element;
        if (!targetElement) return;
        
        const rect = targetElement.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        
        let position = 'bottom';
        
        if (rect.bottom + 250 > viewportHeight) {
            position = 'top';
        }
        
        if (rect.left + 250 > viewportWidth) {
            if (position === 'top') {
                position = 'top left';
            } else {
                position = 'bottom left';
            }
        }
        
        this.tooltipPosition = position;
    }

    onTagButtonClick(event: any) {
        event.stopPropagation();
        event.preventDefault();
        
        const fieldType = this.currentFocusedField;
        
        if (fieldType) {
            this.showTagsTooltip(fieldType, event);
        } else {
            this.currentFocusedField = 'ckeditor';
            this.showTagsTooltip('ckeditor', event);
        }
    }

    onTagClick(event: any) {
        if (this.templateEditMode) {
            if (event.itemData == EmailTags.SenderCompanyLogo)
                this.insertImageElement("#" + event.itemData + "#");
            else this.addTextTag(event.itemData);
        } else {
            let value = this.getTagValue(event.itemData);
            
            if (value) {
                if (event.itemData == EmailTags.SenderCompanyLogo) {
                    if (value.startsWith('http') || value.startsWith('data:')) {
                        this.insertImageElement(value);
                    } else {
                        this.insertImageElement("#" + event.itemData + "#");
                    }
                } else if (event.itemData == EmailTags.SenderEmailSignature) {
                    if (value.includes('<') && value.includes('>')) {
                        this.insertHtml(value);
                    } else {
                        this.insertHtml("#" + event.itemData + "#");
                    }
                } else {
                    if (this.currentFocusedField) {
                        this.insertTagIntoFocusedField(value);
                    } else {
                        this.insertTagIntoCKEditor(value);
                    }
                }
            }
        }

        this.invalidate();
        this.isTagsTooltipVisible = false;
        
        setTimeout(() => {
            if (!this.currentFocusedField && !this.isTagsTooltipVisible) {
                this.currentFocusedField = '';
                this.currentFocusedElement = null;
                this.changeDetectorRef.detectChanges();
            }
        }, 1000);
    }

    insertTagIntoFocusedField(tagValue: string) {
        switch (this.currentFocusedField) {
            case 'subject':
                this.insertTagIntoSubject(tagValue);
                break;
            case 'previewText':
                this.insertTagIntoPreview(tagValue);
                break;
            case 'ckeditor':
                this.insertTagIntoCKEditor(tagValue);
                break;
            default:
                this.insertTagIntoCKEditor(tagValue);
                break;
        }
    }

    insertTagIntoTitle(tagValue: string) {
        if (this.data.title !== undefined) {
            const currentValue = this.data.title || '';
            let newValue = currentValue;
            
            try {
                const focusedElement = this.currentFocusedElement;
                if (focusedElement && focusedElement.selectionStart !== undefined) {
                    const cursorPos = focusedElement.selectionStart;
                    newValue = currentValue.slice(0, cursorPos) + tagValue + currentValue.slice(cursorPos);
                    this.data.title = newValue;
                    
                    setTimeout(() => {
                        if (focusedElement && focusedElement.focus) {
                            focusedElement.focus();
                            if (focusedElement.setSelectionRange) {
                                const newCursorPos = cursorPos + tagValue.length;
                                focusedElement.setSelectionRange(newCursorPos, newCursorPos);
                            }
                        }
                    }, 10);
                } else {
                    this.data.title = currentValue + tagValue;
                }
            } catch (error) {
                this.data.title = currentValue + tagValue;
            }
            
            this.changeDetectorRef.markForCheck();
        }
    }

    insertTagIntoSubject(tagValue: string) {
        if (this.data.subject !== undefined) {
            const currentValue = this.data.subject || '';
            let newValue = currentValue;
            
            try {
                const focusedElement = this.currentFocusedElement;
                if (focusedElement && focusedElement.selectionStart !== undefined) {
                    const cursorPos = focusedElement.selectionStart;
                    newValue = currentValue.slice(0, cursorPos) + tagValue + currentValue.slice(cursorPos);
                    this.data.subject = newValue;
                    
                    setTimeout(() => {
                        if (focusedElement && focusedElement.focus) {
                            focusedElement.focus();
                            if (focusedElement.setSelectionRange) {
                                const newCursorPos = cursorPos + tagValue.length;
                                focusedElement.setSelectionRange(newCursorPos, newCursorPos);
                            }
                        }
                    }, 10);
                } else {
                    this.data.subject = currentValue + tagValue;
                }
            } catch (error) {
                this.data.subject = currentValue + tagValue;
            }
            
            this.changeDetectorRef.markForCheck();
        }
    }

    insertTagIntoPreview(tagValue: string) {
        if (this.data.previewText !== undefined) {
            const currentValue = this.data.previewText || '';
            let newValue = currentValue;
            
            try {
                const focusedElement = this.currentFocusedElement;
                if (focusedElement && focusedElement.selectionStart !== undefined) {
                    const cursorPos = focusedElement.selectionStart;
                    newValue = currentValue.slice(0, cursorPos) + tagValue + currentValue.slice(cursorPos);
                    this.data.previewText = newValue;
                    
                    setTimeout(() => {
                        if (focusedElement && focusedElement.focus) {
                            focusedElement.focus();
                            if (focusedElement.setSelectionRange) {
                                const newCursorPos = cursorPos + tagValue.length;
                                focusedElement.setSelectionRange(newCursorPos, newCursorPos);
                            }
                        }
                    }, 10);
                } else {
                    this.data.previewText = currentValue + tagValue;
                }
            } catch (error) {
                this.data.previewText = currentValue + tagValue;
            }
            
            this.changeDetectorRef.markForCheck();
        }
    }

    insertTagIntoCKEditor(tagValue: string) {
        console.log('CKEditor instance:', this.ckEditor);
        this.data.body += "<div>" + tagValue + "</div>";

        if (this.ckEditor) {
            try {
                // For CKEditor 4, the instance should be available
                if (this.ckEditor.instance) {
                    // Ensure CKEditor is focused
                    this.ckEditor.instance.focus();
                    
                    // Try to insert at cursor position first
                    const selection = this.ckEditor.instance.getSelection();
                    if (selection && selection.getRanges && selection.getRanges().length > 0) {
                        const range = selection.getRanges()[0];
                        // Create a text node and insert it
                        const textNode = this.ckEditor.instance.document.createTextNode(tagValue);
                        range.insertNode(textNode);
                        
                        // Update the data binding
                        const newContent = this.ckEditor.instance.getData();
                        this.data.body = newContent;
                        
                        // Trigger change events
                        this.ckEditor.instance.fire('change');
                        this.ckEditor.instance.fire('input');
                        
                        // Move cursor after the inserted text
                        range.collapse(false);
                        selection.selectRanges([range]);
                        
                        return;
                    }
                    
                    // If no selection, append to the end
                    const currentContent = this.ckEditor.instance.getData();
                    const newContent = currentContent + tagValue;
                    
                    this.ckEditor.instance.setData(newContent);
                    this.data.body = newContent;
                    
                    // Trigger change events
                    this.ckEditor.instance.fire('change');
                    this.ckEditor.instance.fire('input');
                } else {
                    console.warn('CKEditor instance not available');
                }
            } catch (error) {
                console.error('Error inserting tag into CKEditor:', error);
                // Last resort: append to the end
                if (this.ckEditor.instance) {
                    const currentContent = this.ckEditor.instance.getData();
                    const newContent = currentContent + tagValue;
                    this.ckEditor.instance.setData(newContent);
                    this.data.body = newContent;
                }
            }
        } else {
            console.warn('CKEditor not initialized');
        }
    }

    getTagValue(name: string): string {
        let value = this.params.tags && this.params.tags[name];
        
        if (name == EmailTags.SenderPhone && value) {
            value = this.phonePipe.transform(value);
        }
        
        if (!value && this.params.contactIds) {
            value = "#" + name + "#";
        }
        
        return value;
    }

    getTagText(tag: string): string {
        return tag.replace(/([A-Z])/g, ' $1').trim();
    }

    addTextTag(tag: string) {
        if (this.ckEditor && this.ckEditor.instance) {
            try {
                // Ensure CKEditor is focused
                this.ckEditor.instance.focus();
                
                // For CKEditor 4, use insertHtml method
                this.ckEditor.instance.insertHtml("#" + tag + "#");
                
                // Update the data binding
                const newContent = this.ckEditor.instance.getData();
                this.data.body = newContent;
                
                // Trigger change events
                this.ckEditor.instance.fire('change');
                this.ckEditor.instance.fire('input');
            } catch (error) {
                console.error('Error adding text tag to CKEditor:', error);
                // Fallback to manual insertion
                const currentContent = this.ckEditor.instance.getData();
                const newContent = currentContent + "#" + tag + "#";
                this.ckEditor.instance.setData(newContent);
                this.data.body = newContent;
            }
        } else {
            console.warn('CKEditor not initialized or instance not available');
        }
    }

    insertImageElement(imageUrl: string) {
        if (this.ckEditor && this.ckEditor.instance) {
            const imgElement = `<img src="${imageUrl}" alt="Image" style="max-width: 100%; height: auto;" />`;
            
            try {
                // Ensure CKEditor is focused
                this.ckEditor.instance.focus();
                
                // For CKEditor 4, use insertHtml method
                this.ckEditor.instance.insertHtml(imgElement);
                
                // Update the data binding
                const newContent = this.ckEditor.instance.getData();
                this.data.body = newContent;
                
                // Trigger change events
                this.ckEditor.instance.fire('change');
                this.ckEditor.instance.fire('input');
            } catch (error) {
                console.error('Error inserting image into CKEditor:', error);
                // Fallback to manual insertion
                const currentContent = this.ckEditor.instance.getData();
                const newContent = currentContent + imgElement;
                this.ckEditor.instance.setData(newContent);
                this.data.body = newContent;
            }
        } else {
            console.warn('CKEditor not initialized or instance not available');
        }
    }

    insertHtml(html: string) {
        if (this.ckEditor && this.ckEditor.instance) {
            try {
                // Ensure CKEditor is focused
                this.ckEditor.instance.focus();
                
                // For CKEditor 4, use insertHtml method
                this.ckEditor.instance.insertHtml(html);
                
                // Update the data binding
                const newContent = this.ckEditor.instance.getData();
                this.data.body = newContent;
                this.ckEditor.instance.fire('change');
                this.ckEditor.instance.fire('input');
            } catch (error) {
                console.error('Error inserting HTML into CKEditor:', error);
                // Fallback to manual insertion
                const currentContent = this.ckEditor.instance.getData();
                const newContent = currentContent + html;
                this.ckEditor.instance.setData(newContent);
                this.data.body = newContent;
            }
        } else {
            console.warn('CKEditor not initialized or instance not available');
        }
    }

    updateFormValidation() {
        if (this.validationGroup && this.validationGroup.instance) {
            setTimeout(() => {
                this.validationGroup.instance.validate();
            }, 100);
        }
        
        if (this.currentFocusedField === 'ckeditor') {
            this.updateDataLength();
        }
    }
}
