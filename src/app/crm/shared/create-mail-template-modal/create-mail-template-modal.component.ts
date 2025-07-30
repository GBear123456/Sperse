/** Core imports */
import {
    Component,
    OnInit,
    Inject,
    ViewChild,
    Input,
    Output,
    EventEmitter,
    ElementRef,
    ChangeDetectorRef
} from "@angular/core";
/** Third party imports */
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { FeatureCheckerService } from "abp-ng2-module";
import { DxValidatorComponent } from "devextreme-angular/ui/validator";
import { NotifyService } from "abp-ng2-module";
import { DxValidationGroupComponent } from "devextreme-angular";
import { finalize } from "rxjs/operators";
import { Observable, Subject } from "rxjs";

/** Application imports */
import { ModalDialogComponent } from "@shared/common/dialogs/modal/modal-dialog.component";
import { prompts } from "../email-template-dialog/prompts";
import { AppLocalizationService } from "@app/shared/common/localization/app-localization.service";
import { IDialogButton } from "@shared/common/dialogs/modal/dialog-button.interface";
import { CreateEmailTemplateData } from "./create-mail-template-data.interface";
import {
    EmailTemplateServiceProxy,
    CreateEmailTemplateRequest,
    UpdateEmailTemplateRequest,
    FileInfo,
    EmailTemplateType,
} from "@shared/service-proxies/service-proxies";

@Component({
    selector: "create-mail-template-modal-dialog",
    templateUrl: "./create-mail-template-modal.component.html",
    styleUrls: ["./create-mail-template-modal.component.less"],
})
export class CreateMailTemplateModalComponent implements OnInit {
    @ViewChild(ModalDialogComponent) modalDialog: ModalDialogComponent;
    @ViewChild(DxValidatorComponent) validator: DxValidatorComponent;
    @ViewChild(DxValidationGroupComponent)
    validationGroup: DxValidationGroupComponent;
    @ViewChild("contentEditableDiv")
    contentEditableDiv!: ElementRef<HTMLDivElement>;

    @Output() onSave: EventEmitter<CreateEmailTemplateData> =
        new EventEmitter<CreateEmailTemplateData>();

        aiModels: any[] = [];
    processing = false;
    selectedPromptGroupIndex: number = 0;
    selectedPromptItemIndex: number = 0;
    public editorData: string = "<p>This is Template1</p>";
    editorError: string | null = null;
    templateEditMode: boolean = false;
    buttons: IDialogButton[];
    showAIPrompt = false;
    propmtTooltipVisible = false;
    groupedPromptLibrary: any = prompts;
    showAIOption = false;
    aiTooltipVisible = false;
    selectedItemId: string | null = null;
    dataRecord = { modelId: null };
    previewText: string;
    ckEditor: any;
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
    constructor(
        public dialogRef: MatDialogRef<CreateMailTemplateModalComponent>,
        public ls: AppLocalizationService,
        private features: FeatureCheckerService,
        private notifyService: NotifyService,
        private emailTemplateProxy: EmailTemplateServiceProxy,
        public changeDetectorRef: ChangeDetectorRef,


        @Inject(MAT_DIALOG_DATA) public data: CreateEmailTemplateData
    ) {
        this.data = this.data || {
            title: "",
            previewText: "",
            subject: "",
            body: "",
            type: EmailTemplateType.Invoice,
            cc: undefined,
            bcc: undefined,
            attachments: undefined,
        };
    }

    ngOnInit(): void {
        this.initDialogButtons();
        this.aiModels = [
            {
                id: '1',
                name: 'GPT-4o',
                icon: `openai.png`,
                enabled: true,
                model: 'gpt-4o'
            },
            {
                id: '2',
                name: 'GPT-4 Mini',
                icon: `openai.png`,
                enabled: true,
                model: 'gpt-4-mini'
            },
            {
                id: '3',
                name: 'GPT-4 Turbo',
                icon: `openai.png`,
                enabled: true,
                model: 'gpt-4-turbo'
            },
            {
                id: '5',
                name: 'GPT-4',
                icon: `openai.png`,
                enabled: true,
                model: 'gpt-4'
            },
            {
                id: '6',
                name: 'Claude 3.5 Sonnet',
                icon: `claude.png`,
                enabled: false,
                model: 'claude-3.5-sonnet-20240620'
            },
            {
                id: '7',
                name: 'Claude 3 Opus',
                icon: `claude.png`,
                enabled: false,
                model: 'claude-3-opus-20240229'
            },
            {
                id: '8',
                name: 'Claude 3 Haiku',
                icon: `claude.png`,
                enabled: false,
                model: 'claude-3-haiku-20240307'
            },
            {
                id: '9',
                name: 'Gemini 1.5 Pro',
                icon: `gemini.png`,
                enabled: false,
                model: 'gemini-1.5-pro-latest'
            },
            {
                id: '10',
                name: 'Gemini 1.5 Flash',
                icon: `gemini.png`,
                enabled: false,
                model: 'gemini-1.5-flash-latest'
            },
        ];
        // var defaultHeight = 595;
        // if (innerHeight > 1110) {
        //     defaultHeight = 450;
        // }

        // this.ckConfig.height = this.editorHeight ? this.editorHeight : innerHeight -
        //     (this.features.isEnabled(AppFeatures.CRMBANKCode) ? 244 : defaultHeight) + 'px';
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
        ];
    }
    toggleAIPrompt() {
        this.showAIPrompt = !this.showAIPrompt;
    }

    openAIOptionDiv() {
        this.showAIOption = true;
    }

    closeAIOptionDiv() {
        this.showAIOption = false;
    }

    updateDataLength() {}

    invalidate() {}

    
    // AI prompt functions
    selectedAIItem(item: any): void {
        this.selectedItemId = item.itemData.id;
        this.dataRecord.modelId = item.itemData.id;
        this.aiTooltipVisible = false;
    }
    updateButtons() {
        this.buttons = this.buttons.map(button => {
            if (button.id === 'genrateAIOptions') {
                return {
                    ...button,
                    title: this.processing ? this.ls.l('Generating...') : this.ls.l("Write with AI")
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

        const prompt = this.groupedPromptLibrary[this.selectedPromptGroupIndex]?.prompts[this.selectedPromptItemIndex]?.prompt;
        const model = this.aiModels.find((item: any) => item.id == this.selectedItemId)?.model ?? 'gpt-3.5-turbo';

        const payload = {
            model,
            prompt,
            system: 'You are an expert email marketer. Your task is to create compelling email content based on user input.',
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
            console.log('ChatGPT Response:', data);
            this.invalidate();
            this.processing = false;
            
            const gptResponse = data.response;
            const responseData = this.extractContent(gptResponse);
            this.data.subject = responseData.subject;
            this.data.body = this.formatEmailContent(responseData.body) as unknown as string;

            this.updateButtons();
        })
        .catch(error => {
            this.processing = false;
            console.error('Error calling ChatGPT Function:', error);
            this.updateButtons();
        });
    }
    extractContent(content: any): { subject: string, body: string } {
        const subjectMatch = content.match(/^Subject: (.*?)(?:\n\n|$)/);
        const subject = subjectMatch ? subjectMatch[1] : '';
        const body = content.replace(/^Subject: .*?\n\n/, '');
        return { subject, body };
    }
    formatEmailContent(response: string): string {
        const formattedResponse = response.replace(/\n/g, '</br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        const updateHtmlRes = formattedResponse.replace(/^```html/, '').replace(/^```/, '').replace(/```$/, '');
        return updateHtmlRes.toString().replace('SafeValue must use [property]=binding', '').replace(/<div[^>]*>(\s|&nbsp;)*<\/div>/g, '');
    }

    previewInputFocusOut(event, checkDisplay?) {
        event.text = event.event.target.value;

        let isComboListEmpty = !event.text.length;

        if (isComboListEmpty) {
            this.previewText = event.text;
        }
    }
    // ckeditor
    onContentChange(event: any) {
        this.editorContent = event.target.innerHTML;
        this.invalidate();
    }

    onPaste(event: ClipboardEvent): void {
        event.preventDefault();
        const pasteContent = event.clipboardData?.getData("text/plain");
        document.execCommand("insertText", false, pasteContent);
        this.editorContent = (event.target as HTMLElement).innerText;
        this.invalidate();
    }
    onReady(event: any) {
        console.log("Editor is ready:", event);
    }

    onChange(event: any) {
        this.data.body = this.editorContent;
        console.log("Editor content changed:", this.editorData);
    }
    // save && edit template data
    saveTemplate() {
        console.log("save button clicked");
        this.data.body = this.editorContent;

        const isValid = this.validateData();
        if (isValid) {
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
        // const attachments =
        //     this.data.attachments?.map(
        //         (item) =>
        //             new FileInfo({
        //                 id: item.fileId || item.id,
        //                 name: item.name,
        //             })
        //     ) || [];

        // Prepare template data
        const isUpdating = this.data.id;
        const templateData = {
            id: isUpdating ? this.data.id : undefined,
            name: this.data.title,
            type: this.data.type,
            subject: this.data.subject,
            previewText: this.data.previewText,
            body: this.data.body,
            attachments: undefined,
            cc: undefined,
            bcc: undefined,
        };

        this.startLoading();

        const request$: Observable<any> = isUpdating
            ? this.emailTemplateProxy.update(
                  new UpdateEmailTemplateRequest(templateData)
              )
            : this.emailTemplateProxy.create(
                  new CreateEmailTemplateRequest(templateData)
              );

        request$.pipe(finalize(() => this.finishLoading())).subscribe({
            next: (response: any) => {
                // Handle response (response could be a number or an object with an ID)
                let id: number;
                if (typeof response === "number") {
                    id = response;
                } else if (response && response.result) {
                    id = response.result; // Handle ABP response format
                } else {
                    throw new Error("Unexpected response format");
                }

                // if (id) {
                //     this.data.templateId = id;
                // }
                // this.data.attachments =
                //     this.data.attachments?.map((item) => ({
                //         ...item,
                //         fromTemplate: true,
                //         loader: undefined,
                //     })) || [];

                this.onSave.emit(this.data);
                this.close();
                this.notifyService.success(this.ls.l("SuccessfullySaved"));
                this.resetForm();
            },
            error: (error) => {
                // Handle specific error messages from the backend
                let errorMessage = this.ls.l("ErrorSavingTemplate");
                if (error.error?.message) {
                    errorMessage = error.error.message; // ABP error format
                } else if (error.message) {
                    errorMessage = error.message;
                }
                this.notifyService.error(errorMessage);
                console.error("Error saving template:", error);
            },
            complete: () => {
                // Ensure loading is finished
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
            type: EmailTemplateType.Invoice,
            attachments: [],
            cc: [],
            bcc: [],
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
}
