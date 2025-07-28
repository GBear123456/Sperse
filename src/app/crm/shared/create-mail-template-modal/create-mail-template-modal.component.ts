import { Component, OnInit, Inject, ViewChild, Input } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { ModalDialogComponent } from "@shared/common/dialogs/modal/modal-dialog.component";
import { IDialogButton } from "@shared/common/dialogs/modal/dialog-button.interface";
import { AppLocalizationService } from "@app/shared/common/localization/app-localization.service";
import { prompts } from "../email-template-dialog/prompts";
import { DxValidatorComponent } from "devextreme-angular/ui/validator";
import { FeatureCheckerService } from 'abp-ng2-module';
import { AppFeatures } from '@shared/AppFeatures';

@Component({
    selector: "create-mail-template-modal-dialog",
    templateUrl: "./create-mail-template-modal.component.html",
    styleUrls: ["./create-mail-template-modal.component.less"],
})
export class CreateMailTemplateModalComponent implements OnInit {
    @ViewChild(ModalDialogComponent) modalDialog: ModalDialogComponent;
    @ViewChild(DxValidatorComponent) validator: DxValidatorComponent;
    @Input() editorHeight;
    public editorData = "<p>This is Template1</p>"
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

        @Inject(MAT_DIALOG_DATA) public data: any
    ) {}

    ngOnInit(): void {
        this.initDialogButtons();
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

    selectedAIItem(item: any): void {
        this.selectedItemId = item.itemData.id;
        this.dataRecord.modelId = item.itemData.id;
        this.aiTooltipVisible = false;
    }

    generateAIMessage() {
        // this.getChatGptResponse();
    }

    previewInputFocusOut(event, checkDisplay?) {
        event.text = event.event.target.value;

        let isComboListEmpty = !event.text.length;

        if (isComboListEmpty) {
            this.previewText = event.text;
        }
    }
    onReady(event: any) {
        console.log('Editor is ready:', event);
      }
    
      onChange(event: any) {
        console.log('Editor content changed:', this.editorData);
      }
}
