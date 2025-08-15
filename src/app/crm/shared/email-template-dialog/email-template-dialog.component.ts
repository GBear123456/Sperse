/** Core imports */
import {
    Component,
    ChangeDetectionStrategy,
    ViewChild,
    OnInit,
    ElementRef,
    Inject,
    ChangeDetectorRef,
    Input,
    Output,
    EventEmitter,
    AfterViewInit,
    HostListener,
    OnDestroy,
    Injector

} from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";

/** Third party imports */
import { Observable, Subject, BehaviorSubject } from "rxjs";
import { finalize, startWith, switchMap } from "rxjs/operators";
import {
    MAT_DIALOG_DATA,
    MatDialog,
    MatDialogRef,
} from "@angular/material/dialog";
import { DxValidationGroupComponent } from "devextreme-angular";
import { DxSelectBoxComponent } from "devextreme-angular/ui/select-box";
import { DxValidatorComponent } from "devextreme-angular/ui/validator";
import { DxScrollViewComponent } from "devextreme-angular/ui/scroll-view";
import { NgxFileDropEntry } from "ngx-file-drop";
import startCase from "lodash/startCase";
import { environment } from "@root/environments/environment";

/** Application imports */
import { AppService } from "@app/app.service";
import { AppConsts } from "@shared/AppConsts";
import { NotifyService } from "abp-ng2-module";
import { AppFeatures } from "@shared/AppFeatures";
import { FeatureCheckerService } from "abp-ng2-module";
import { ProfileService } from "@shared/common/profile-service/profile.service";
import { ModalDialogComponent } from "@shared/common/dialogs/modal/modal-dialog.component";
import { AppLocalizationService } from "@app/shared/common/localization/app-localization.service";
import { IDialogButton } from "@shared/common/dialogs/modal/dialog-button.interface";
import { CacheHelper } from "@shared/common/cache-helper/cache-helper";
import { CacheService } from "ng2-cache-service";
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
    Attachment,
    TenantSettingsServiceProxy,
} from "@shared/service-proxies/service-proxies";
import { PhoneFormatPipe } from "@shared/common/pipes/phone-format/phone-format.pipe";
import { AppSessionService } from "@shared/common/session/app-session.service";
import { TemplateDocumentsDialogComponent } from "@app/crm/contacts/documents/template-documents-dialog/template-documents-dialog.component";
import { EmailTemplateData } from "@app/crm/shared/email-template-dialog/email-template-data.interface";
import { EmailAttachment } from "@app/crm/shared/email-template-dialog/email-attachment";
import { EmailTags } from "@app/crm/contacts/contacts.const";
import { TemplateDocumentsDialogData } from "@app/crm/contacts/documents/template-documents-dialog/template-documents-dialog-data.interface";
import { AppPermissionService } from "@shared/common/auth/permission.service";
import { AppPermissions } from "@shared/AppPermissions";
import { DxContextMenuComponent } from "devextreme-angular/ui/context-menu";
import { CrmService } from "@app/crm/crm.service";
import { CreateMailTemplateModalComponent } from "@app/crm/shared/create-mail-template-modal/create-mail-template-modal.component";
import { FormGroup, FormBuilder } from "@angular/forms";
import { prompts } from "./prompts";


// HTML editor
import * as ace from "ace-builds";
import "ace-builds/src-min-noconflict/mode-html";
import "ace-builds/src-min-noconflict/theme-monokai";
import "ace-builds/src-min-noconflict/ext-language_tools";
import "ace-builds/src-noconflict/theme-solarized_dark";
import "ace-builds/src-noconflict/theme-twilight";
import "ace-builds/src-noconflict/theme-chaos";
import "ace-builds/src-noconflict/theme-dracula";
import "ace-builds/src-noconflict/theme-github_dark";
import * as prettier from "prettier";
import * as prettierPluginVoidHtml from "@awmottaz/prettier-plugin-void-html";
import * as parserHtml from "prettier/plugins/html";
import { DxTextBoxComponent } from "devextreme-angular/ui/text-box";

@Component({
    selector: "email-template-dialog",
    templateUrl: "email-template-dialog.component.html",
    styleUrls: ["email-template-dialog.component.less"],
    providers: [CacheHelper, PhoneFormatPipe, EmailTemplateServiceProxy, TenantSettingsServiceProxy],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmailTemplateDialogComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild(ModalDialogComponent) modalDialog: ModalDialogComponent;
    @ViewChild(DxSelectBoxComponent) templateComponent: DxSelectBoxComponent;
    @ViewChild(DxValidationGroupComponent)
    validationGroup: DxValidationGroupComponent;
    @ViewChild(DxValidatorComponent) validator: DxValidatorComponent;
    @ViewChild(DxContextMenuComponent)
    addEmailComponent: DxContextMenuComponent;
    @ViewChild("scrollView") scrollView: DxScrollViewComponent;
    @ViewChild("contentEditableDiv")
    contentEditableDiv!: ElementRef<HTMLDivElement>;
    // @ViewChild('tagsButton') tagsButton: ElementRef;
    @ViewChild("aiButton") aiButton: ElementRef;
    @ViewChild("editor") private editorRef!: ElementRef<HTMLElement>;
    @ViewChild("tagsButton") tagsTooltip!: ElementRef;
    @ViewChild("subjectField") subjectField: DxTextBoxComponent;
    @ViewChild("PreviewTextElement") PreviewTextElement: DxTextBoxComponent;
    @ViewChild("tooltipTargetElement") tooltipTargetElement: ElementRef;
    private aceEditor!: ace.Ace.Editor;
    isTagsTooltipVisible = false;
    title: string = "New Email";
    ckEditor: any;
    envHost = environment;
    groupedPromptLibrary: any = prompts;
    selectedPromptGroupIndex: number = 0;
    selectedPromptItemIndex: number = 0;
    templateLoaded: boolean;
    fromDataSource: EmailFromInfo[] = [];
    showCC = false;
    showBCC = false;
    tagLastValue: string;
    aiTooltipVisible = false;
    showAIPrompt = false;
    propmtTooltipVisible = false;
    curTemplateId: number | undefined;
    templateData = {
        body: "",
        subject: "",
        previewText: "",
        attachments: [],
    };
    private readonly WEBSITE_LINK_TYPE_ID = "J";

    // New properties for dynamic tooltip positioning
    tooltipPosition: string = 'bottom';
    tooltipTarget: string = '';
    currentFocusedField: string = '';
    currentFocusedElement: any = null;
    currentInputElement: any = null;
    tooltipButtonLeft: number = 0;
    tooltipButtonTop: number = 0;

    @Input() tagsList = [];
    @Input() editorHeight;
    @Input() templateEditMode = false;
    @Output() onSave: EventEmitter<EmailTemplateData> =
        new EventEmitter<EmailTemplateData>();
    @Output() onTemplateCreate: EventEmitter<number> =
        new EventEmitter<number>();
    @Output() onTemplateChange: EventEmitter<number> =
        new EventEmitter<number>();
    @Output() onTagItemClick: EventEmitter<string> = new EventEmitter<string>();
    @Output() onTemplateDelete: EventEmitter<number> =
        new EventEmitter<number>();

    isManageUnallowed = !this.permission.isGranted(
        AppPermissions.CRMSettingsConfigure,
    );
    isSettingsAllowed =
        this.permission.isGranted(AppPermissions.AdministrationTenantHosts) ||
        (this.appService.isHostTenant
            ? this.permission.isGranted(
                  AppPermissions.AdministrationHostSettings,
              )
            : this.permission.isGranted(
                  AppPermissions.AdministrationTenantSettings,
              ));

    buttons: IDialogButton[];
    _refresh: Subject<null> = new Subject<null>();
    refresh$: Observable<null> = this._refresh.asObservable();
    templates$: Observable<GetTemplatesResponse[]> = this.refresh$.pipe(
        startWith(null),
        switchMap(() =>
            this.emailTemplateProxy.getTemplates(this.data.templateType),
        ),
    );
    filteredTemplates$: BehaviorSubject<GetTemplatesResponse[]> =
        new BehaviorSubject<GetTemplatesResponse[]>([]);
    searchTerm: string = "";
    // Cache templates locally to avoid repeated HTTP requests during filtering
    private cachedTemplates: GetTemplatesResponse[] = [];
    private searchDebounceTimer: any;
    attachments: Partial<EmailAttachment>[] = this.data.attachments || [];
    uniqId = Math.random().toString().slice(-7);
    charCount: number;
    forceValidationBypass = true;
    emailRegEx = AppConsts.regexPatterns.email;
    curTemplateTitle: string;
    showSetting: boolean = false;
    @Input() templateType: EmailTemplateType;

    storeAttachmentsToDocumentsCacheKey = "StoreAttachmentsToDocuments";
    private ckEditorDocument: Document | null = null;
    ckConfig: any = {
        versionCheck: false,
        enterMode: 3 /* CKEDITOR.ENTER_DIV */,
        pasteFilter: null,
        toolbarLocation: "bottom",
        allowedContent: true,
        toolbarCanCollapse: true,
        startupShowBorders: false,
        resize_enabled: true,
        resize_dir: 'both', // Allow resizing in both directions (horizontal and vertical)
        resize_minWidth: 300, // Minimum width in pixels
        resize_minHeight: 200, // Minimum height in pixels
        resize_maxWidth: 800, // Maximum width in pixels
        resize_maxHeight: 600,
        qtBorder: 0,
        width: "100%",
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

    // Configuration for template preview (read-only, no toolbar)
    templatePreviewConfig: any = {
        versionCheck: false,
        enterMode: 3 /* CKEDITOR.ENTER_DIV */,
        pasteFilter: null,
        toolbar: [], // Empty toolbar - no editing tools
        allowedContent: true,
        startupShowBorders: false,
        resize_enabled: false, // Disable resizing for preview
        readOnly: true, // Make it read-only
        width: "100%",
        height: "400px",
        stylesSet: [],
        contentsCss: [],
        removePlugins: "elementspath,resize",
        extraPlugins: "showblocks",
        skin: "moono-lisa",
    };

    saveButtonOptions = [
        { text: this.ls.l("Save"), selected: false },
        { text: this.ls.l("SaveAsNew"), selected: false },
        { text: this.ls.l("SaveAndClose"), selected: false },
    ];
    lastSelectedTemplateId: number;
    customItem: any;

    aiList = [
        { id: 1, name: "Fix Formatting Issues", disabled: false },
        { id: 2, name: "Summarize Text", disabled: true },
        { id: 3, name: "Paraphrase Text", disabled: true },
        { id: 4, name: "Grammar and Spell Check", disabled: true },
    ];

    filteredItems: any[] = [];
    aiModels: any[] = [];
    dataRecord = { modelId: null };
    promptLibrary: any[] = [];

    selectedItemId: string | null = '1';
    // bankCodeEnabled = this.features.isEnabled(AppFeatures.CRMBANKCode);

    showNewEmailTab = true;
    showHtmlEditor = false;
    showTemplate = false;
    selectedTab: string = "new-email";
    internalTemplateId?: number;
    placeholderText: string = "Search templates";
    editorColor: string = "#272822";
    sendEmailMenuInit$: Observable<any>;
    addSendEmailMenuItems: any[] = [
        {
            text: "Schedule",
            selected: false,
            icon: "clock",
            visible: true,
        },
        {
            text: "Send",
            selected: false,
            icon: "message",
            visible: true,
        },
        {
            text: "Save as Draft",
            selected: false,
            icon: "save",
            visible: true,
        },
    ];
    @ViewChild("editor", { static: false }) editor: any;
    templateForm: FormGroup;

    editorSettings = {
        fontSize: 14,
        theme: "ace/theme/monokai",
        showLineNumbers: true,
        showPrintMargin: false,
    };

    editorThemes = [
        { name: "Monokai", value: "ace/theme/monokai", color: "#272822" },
        { name: "Dracula", value: "ace/theme/dracula", color: "#282a36" },
        { name: "Chaos", value: "ace/theme/chaos", color: "#161616" },
        { name: "Github", value: "ace/theme/github_dark", color: "#24292e" },
        {
            name: "Solarized Dark",
            value: "ace/theme/solarized_dark",
            color: "#002B36",
        },
        { name: "Twilight", value: "ace/theme/twilight", color: "#141414" },
    ];
    get lineNumbers(): number[] {
        return Array.from(
            { length: this.data.body.split("\n").length },
            (_, i) => i + 1,
        );
    }

    constructor(
        injector: Injector,
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
        private fb: FormBuilder,
        private crmService: CrmService,
        @Inject(MAT_DIALOG_DATA) public data: EmailTemplateData,
        private tenantSettingsService: TenantSettingsServiceProxy,

    ) {
        if (!data.suggestionEmails) data.suggestionEmails = [];

        this.templateForm = this.fb.group({
            emailContentBodyTemplate: [this.data.body],
        });

        data.saveAttachmentsToDocuments = this.getAttachmentsToDocumentsCache();
        this.templates$.subscribe((templates) => {
            this.cachedTemplates = templates || [];
            this.filteredTemplates$.next(templates);
        });
    }

    ngOnInit() {
        this.templateForm
            .get("emailContentBodyTemplate")
            ?.valueChanges.subscribe((value) => {
                this.data.body = value;
            });

        setTimeout(() => {
            this.editor?.layout();
        }, 0);
        this.ckConfig.versionCheck = false;
        if (this.templateEditMode && this.data.templateId)
            this.loadTemplateById(this.data.templateId);
        else {
            if (!this.data.tags && (this.data.contactId || this.data.contact)) {
                this.startLoading();
                this.communicationProxy
                    .getEmailData(
                        undefined,
                        this.data.contactId || this.data.contact.id,
                    )
                    .pipe(finalize(() => this.finishLoading()))
                    .subscribe((res: GetEmailDataOutput) => {
                        this.data.tags = res.tags;
                        this.initFromField();
                    });
            } else this.initFromField();
            this.templateLoaded = true;
        }

        //(window as any).CKEDITOR.disableVersionWarning = true;
        delete this.data.attachments;
        this.dialogRef.afterClosed().subscribe(() => {
            if (this.attachments.length && !this.data.attachments)
                this.attachments.forEach((item) => this.removeAttachment(item));
        });
        this.showCC = Boolean(this.data.cc && this.data.cc.length);
        this.showBCC = Boolean(this.data.bcc && this.data.bcc.length);

        var defaultHeight = 395;
        if (innerHeight > 1110) {
            defaultHeight = 450;
        }

        this.ckConfig.height = this.editorHeight
            ? this.editorHeight
            : innerHeight -
              // (this.features.isEnabled(AppFeatures.CRMBANKCode)
              //     ? 544
              //     : defaultHeight) +
              defaultHeight +
              "px";

        this.initDialogButtons();
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

        this.promptLibrary = [
            {
                id: "1",
                name: "AI Chatbots",
                enabled: true,
            },
            {
                id: "2",
                name: "Customer Support agent",
                enabled: true,
            },
            {
                id: "3",
                name: "Sales Agent",
                enabled: true,
            },
            {
                id: "4",
                name: "Language Tutorial",
                enabled: true,
            },
            {
                id: "5",
                name: "Coding Expert",
                enabled: true,
            },
            {
                id: "6",
                name: "Life Coach",
                enabled: true,
            },
            {
                id: "7",
                name: "Fix Formating Issues",
                enabled: true,
            },
            {
                id: "8",
                name: "Summarize Text",
                enabled: true,
            },
            {
                id: "9",
                name: "Paraphase Text",
                enabled: true,
            },
        ];

        this.filteredItems = [...this.aiModels];
        this.changeDetectorRef.detectChanges();
        
        // Add window resize listener
        window.addEventListener('resize', this.onWindowResize.bind(this));
    }

    ngAfterViewInit(): void {
        this.aceEditor = ace.edit(this.editorRef.nativeElement);

        // Configure editor options
        this.aceEditor.setOptions({
            mode: "ace/mode/html",
            theme: this.editorSettings.theme,
            enableBasicAutocompletion: true,
            enableLiveAutocompletion: true,
            enableSnippets: true,
            fontFamily: "monospace",
            fontSize: this.editorSettings.fontSize,
            showLineNumbers: this.editorSettings.showLineNumbers,
            showPrintMargin: this.editorSettings.showPrintMargin,
        });

        // Set initial content
        this.aceEditor.resize();
        // Load existing content if available
        if (this.data.body) {
            this.aceEditor.session.setValue(this.data.body);
        } else {
            this.aceEditor.session.setValue("");
        }
        this.aceEditor.session.setUseWrapMode(true);
        this.aceEditor.renderer.setScrollMargin(10, 0);

        // Add change event listener for real-time synchronization
        this.aceEditor.session.on('change', () => {
            if (this.showHtmlEditor) {
                this.data.body = this.aceEditor.getValue();
                this.updateDataLength();
                this.changeDetectorRef.detectChanges();
            }
        });

        window.addEventListener("resize", () => {
            this.aceEditor.resize();
        });
    }
    getSanitizedIcon(icon: string) {
        return this.domSanitizer.bypassSecurityTrustHtml(icon);
    }

    filterItems(event: Event): void {
        const searchTerm = (
            event.target as HTMLInputElement
        ).value.toLowerCase();
        this.filteredItems = this.aiModels.filter((item) =>
            item.name.toLowerCase().includes(searchTerm),
        );
    }

    selectedAIItem(item: any): void {
        this.selectedItemId = item.itemData.id;
        this.dataRecord.modelId = item.itemData.id;
        this.aiTooltipVisible = false;
    }

    // selectedPromptItem(item: any): void {
    //     this.selectedItemId = item.id;
    //     //  this.dataRecord.modelId = item.id;
    //     this.propmtTooltipVisible = false;
    // }
    myPreventEscPlugin(editor) {
        editor.on('keydown', function(evt) {
          if (evt.data.keyCode === 27 && editor.commands.get('fullscreen').value) {
            evt.stop(); // stops it from bubbling to mat-dialog
          }
        });
      }
    openCreateOrEditTemplate(id?: number): void {
        const dialogRef = this.dialog.open(CreateMailTemplateModalComponent, {
            data: { id, contact: this.data.contact },
            panelClass: ["slider"],
            hasBackdrop: true,
            closeOnNavigation: true,
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                if(result.id == this.curTemplateId) {
                    this.templateData.body = result.body;
                    this.templateData.attachments= result.attachment;
                    this.templateData.previewText = result.previewText;
                    this.templateData.subject = result.subject;
                    this.curTemplateTitle = result.title;

                }

                this.refresh();
                this.notifyService.success(this.ls.l("TemplateListUpdated"));
            }
        });
    }
    initFromField() {
        let storageKey = "SupportedFrom" + this.sessionService.userId,
            supportedFrom: any = sessionStorage.getItem(storageKey);
        if (supportedFrom) this.initFromDataSource(JSON.parse(supportedFrom));
        else
            this.communicationProxy
                .getSupportedEmailFromAddresses()
                .subscribe((fromEmails: EmailFromInfo[]) => {
                    sessionStorage.setItem(
                        storageKey,
                        JSON.stringify(fromEmails),
                    );
                    this.initFromDataSource(fromEmails);
                });
    }

    initFromDataSource(fromEmails: EmailFromInfo[]) {
        if (fromEmails && fromEmails.length) this.fromDataSource = fromEmails;
        else if (this.data.from)
            this.fromDataSource =
                this.data.from instanceof Array
                    ? this.data.from
                    : [this.data.from];
        if (this.fromDataSource.length) {
            let from =
                this.fromDataSource.find(
                    (item) =>
                        item.emailSettingsSource == EmailSettingsSource.User,
                ) || this.fromDataSource[0];
            this.data.emailSettingsSource = from.emailSettingsSource;
            if (!this.data.isResend) this.checkUpdateCCFromEmail(from);
        }
    }

    checkUpdateCCFromEmail(from) {
        if (this.data.cc && this.data.cc.length)
            this.data.cc = this.data.cc.filter((item) => {
                return !(
                    item.includes(from.emailAddress) ||
                    from.emailAddress.includes(item)
                );
            });

        if (
            from &&
            from.ccEmailAddress &&
            this.data.to &&
            this.data.to.every((item) => item != from.ccEmailAddress)
        ) {
            if (this.data.cc && this.data.cc.length) {
                this.data.cc.push(from.ccEmailAddress);
                this.data.cc = this.data.cc
                    .map((item, index) => {
                        if (
                            this.data.cc.some((item2, index2) => {
                                if (index2 > index) {
                                    let firstItem = item.toLowerCase(),
                                        secondItem = item2.toLowerCase();
                                    return (
                                        secondItem.includes(firstItem) ||
                                        firstItem.includes(secondItem)
                                    );
                                }
                                return false;
                            })
                        )
                            return undefined;
                        return item;
                    })
                    .filter(Boolean);
            } else this.data.cc = [from.ccEmailAddress];
            this.showCC = true;
        }
        this.changeDetectorRef.detectChanges();
    }
    @HostListener('document:keydown.escape', ['$event'])
    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent) {
        this.handleClick(event, document);
        // Also handle global document clicks to close tooltip when clicking outside
        this.handleGlobalClick(event);
      }
    
      // Handle clicks in the CKEditor iframe
      handleCKEditorClick(event: MouseEvent) {
        this.handleClick(event, this.ckEditorDocument!);
        
        // Update button position when clicking inside CKEditor
        if (this.currentFocusedField === 'ckeditor' && this.ckEditor) {
            console.log('CKEditor clicked, updating button position');
            this.calculateButtonPosition('ckeditor', { target: this.ckEditor.container.$ });
            this.changeDetectorRef.detectChanges();
        }
    }
    private handleClick(event: MouseEvent, contextDocument: Document) {
        const targetElement = event.target as HTMLElement;
        const tooltipElement = contextDocument.querySelector('.dx-tooltip-wrapper');
        
        // Check if the click is outside the tags button and the tooltip
        if (
          this.isTagsTooltipVisible &&
          this.tagsTooltip &&
          !this.tagsTooltip.nativeElement.contains(targetElement) &&
          !tooltipElement?.contains(targetElement)
        ) {
          this.isTagsTooltipVisible = false;
          this.hideTagsButton();
          this.changeDetectorRef.detectChanges();
        }
    }

    private handleGlobalClick(event: MouseEvent) {
        const targetElement = event.target as HTMLElement;
        
        // Check if the click is outside the tags button and any visible tooltip
        if (this.isTagsTooltipVisible && this.tagsTooltip) {
            const tooltipElement = document.querySelector('.dx-tooltip-wrapper');
            const tagsButtonElement = this.tagsTooltip.nativeElement;
            
            // Check if click is outside both the tags button and the tooltip
            if (!tagsButtonElement.contains(targetElement) && !tooltipElement?.contains(targetElement)) {
                this.isTagsTooltipVisible = false;
                this.hideTagsButton();
                this.changeDetectorRef.detectChanges();
            }
        }
    }

    private hideTagsButton() {
        // Only hide the button if no field is currently focused
        if (!this.currentFocusedField) {
            this.currentFocusedField = '';
            this.currentFocusedElement = null;
        }
    }

    toggleTooltip() {
    this.isTagsTooltipVisible = !this.isTagsTooltipVisible;
    }

    onFieldFocus(fieldType: string, event: any) {
        console.log('onFieldFocus called with:', { fieldType, event });
        
        this.currentFocusedField = fieldType;
        this.currentFocusedElement = event.element || event.target;
        
        // Calculate button position based on cursor position
        this.calculateButtonPosition(fieldType, event);
        
        // Add cursor tracking for text inputs
        if (fieldType === 'subject' || fieldType === 'preview') {
            this.addCursorTracking(event.element || event.target);
        }
        
        // For CKEditor, add special handling
        if (fieldType === 'ckeditor') {
            this.addCKEditorCursorTracking();
        }
        
        // Track which field is focused for tag insertion
        this.currentFocusedField = fieldType;
        
        console.log('currentFocusedField set to:', this.currentFocusedField);
        
        // Show the tags button when a field is focused
        this.changeDetectorRef.detectChanges();
    }

    onFieldBlur(fieldType: string, event: any) {
        // Remove cursor tracking
        if (fieldType === 'subject' || fieldType === 'preview') {
            this.removeCursorTracking();
        }
        
        // Remove CKEditor cursor tracking
        if (fieldType === 'ckeditor') {
            this.removeCKEditorCursorTracking();
        }
        
        // Don't hide the button immediately when focus is lost
        // This prevents the button from disappearing when clicking on it
        // Only hide after a longer delay to allow for button clicks
        setTimeout(() => {
            // Only hide if no field is focused and tooltip is not visible
            // AND if the click target is not the tags button
            if (!this.currentFocusedField && !this.isTagsTooltipVisible) {
                this.currentFocusedField = '';
                this.currentFocusedElement = null;
                this.changeDetectorRef.detectChanges();
            }
        }, 500); // Increased delay to 500ms to give more time for button interaction
    }

    addCursorTracking(inputElement: any) {
        // Remove any existing tracking
        this.removeCursorTracking();
        
        // Add event listeners for cursor movement
        const events = ['input', 'keyup', 'click', 'mouseup'];
        events.forEach(eventType => {
            inputElement.addEventListener(eventType, this.onCursorMove.bind(this), true);
        });
        
        // Store reference for cleanup
        this.currentInputElement = inputElement;
    }

    removeCursorTracking() {
        if (this.currentInputElement) {
            const events = ['input', 'keyup', 'click', 'mouseup'];
            events.forEach(eventType => {
                this.currentInputElement.removeEventListener(eventType, this.onCursorMove.bind(this), true);
            });
            this.currentInputElement = null;
        }
    }

    onCursorMove(event: any) {
        // Update button position when cursor moves
        if (this.currentFocusedField && this.currentFocusedElement) {
            this.calculateButtonPosition(this.currentFocusedField, { target: this.currentFocusedElement });
            this.changeDetectorRef.detectChanges();
        }
    }


    showTagsTooltip(fieldType: string, event: any) {
        // Ensure the field is marked as focused when showing tooltip
        this.currentFocusedField = fieldType;
        this.currentFocusedElement = event.target;
        
        // Calculate tooltip position based on field type and cursor position
        this.calculateTooltipPosition(fieldType, event);
        
        // Position the hidden target element for the tooltip
        this.positionTooltipTarget(event);
        
        // For CKEditor, ensure button position is updated
        if (fieldType === 'ckeditor' && this.ckEditor) {
            console.log('Showing tags tooltip for CKEditor, updating button position');
            this.calculateButtonPosition('ckeditor', { target: this.ckEditor.container.$ });
        }
        
        // Show tooltip
        this.isTagsTooltipVisible = true;
        
        // Force change detection to ensure button stays visible
        this.changeDetectorRef.detectChanges();
    }

    positionTooltipTarget(event: any) {
        const targetElement = event.target;
        const rect = targetElement.getBoundingClientRect();
        
        // Use the ViewChild reference
        if (this.tooltipTargetElement && this.tooltipTargetElement.nativeElement) {
            const tooltipTarget = this.tooltipTargetElement.nativeElement;
            
            // Position the hidden target element at the same location as the clicked element
            tooltipTarget.style.position = 'absolute';
            tooltipTarget.style.left = rect.left + 'px';
            tooltipTarget.style.top = rect.top + 'px';
            tooltipTarget.style.width = rect.width + 'px';
            tooltipTarget.style.height = rect.height + 'px';
        }
    }

    calculateButtonPosition(fieldType: string, event: any) {
        const targetElement = event.target || event.element;
        if (!targetElement) return;
        
        const rect = targetElement.getBoundingClientRect();
        
        if (fieldType === 'subject' || fieldType === 'preview') {
            // For DevExtreme text boxes, try to get cursor position
            let cursorX = rect.left;
            let cursorY = rect.top;
            
            try {
                // Try to get the actual input element and its cursor position
                const inputElement = targetElement.querySelector('input') || targetElement;
                if (inputElement && inputElement.selectionStart !== undefined) {
                    // Create a temporary span to measure text width up to cursor position
                    const tempSpan = document.createElement('span');
                    tempSpan.style.font = window.getComputedStyle(inputElement).font;
                    tempSpan.style.visibility = 'hidden';
                    tempSpan.style.position = 'absolute';
                    tempSpan.style.whiteSpace = 'pre';
                    tempSpan.style.padding = window.getComputedStyle(inputElement).padding;
                    tempSpan.style.border = window.getComputedStyle(inputElement).border;
                    
                    const textBeforeCursor = inputElement.value.substring(0, inputElement.selectionStart);
                    tempSpan.textContent = textBeforeCursor;
                    document.body.appendChild(tempSpan);
                    
                    const textWidth = tempSpan.offsetWidth;
                    document.body.removeChild(tempSpan);
                    
                    // Position button near the cursor with some offset
                    cursorX = rect.left + Math.min(textWidth + 20, rect.width - 120);
                    cursorY = rect.top + (rect.height / 2) - 15; // Center vertically
                } else {
                    // Fallback: position near the right edge
                    cursorX = rect.right - 120;
                    cursorY = rect.top + (rect.height / 2) - 15;
                }
            } catch (error) {
                // Fallback: position near the right edge
                cursorX = rect.right - 120;
                cursorY = rect.top + (rect.height / 2) - 15;
            }
            
            this.tooltipButtonLeft = cursorX;
            this.tooltipButtonTop = cursorY;
            
        } else if (fieldType === 'ckeditor') {
            // For CKEditor, position the button in a more appropriate location
            let cursorX = rect.left;
            let cursorY = rect.top;
            
            try {
                if (this.ckEditor && this.ckEditor.instance) {
                    // Try to get the current selection position
                    const selection = this.ckEditor.instance.getSelection();
                    if (selection && selection.getRanges && selection.getRanges().length > 0) {
                        const range = selection.getRanges()[0];
                        const rects = range.getClientRects();
                        
                        if (rects && rects.length > 0) {
                            const lastRect = rects[rects.length - 1];
                            // Position button near the cursor in CKEditor
                            cursorX = lastRect.right + 10;
                            cursorY = lastRect.top - 5;
                        } else {
                            // Fallback: position in top-right corner of CKEditor
                            cursorX = rect.right - 120;
                            cursorY = rect.top + 10;
                        }
                    } else {
                        // No selection, position in top-right corner of CKEditor
                        cursorX = rect.right - 120;
                        cursorY = rect.top + 10;
                    }
                } else {
                    // CKEditor not ready, position in top-right corner of the container
                    cursorX = rect.right - 120;
                    cursorY = rect.top + 10;
                }
            } catch (error) {
                console.warn('Error getting CKEditor selection, using fallback positioning:', error);
                // Fallback: position in top-right corner
                cursorX = rect.right - 120;
                cursorY = rect.top + 10;
            }
            
            // Ensure the button is positioned relative to the CKEditor container
            // If we're in the CKEditor area, position it more appropriately
            if (this.ckEditor && this.ckEditor.container) {
                const ckContainer = this.ckEditor.container.$.getBoundingClientRect();
                if (ckContainer) {
                    // Position button in the top-right area of the CKEditor
                    cursorX = ckContainer.right - 120;
                    cursorY = ckContainer.top + 10;
                }
            }
            
            this.tooltipButtonLeft = cursorX;
            this.tooltipButtonTop = cursorY;
        }
        
        // Ensure button stays within viewport
        if (this.tooltipButtonLeft < 0) {
            this.tooltipButtonLeft = 10;
        }
        if (this.tooltipButtonTop < 0) {
            this.tooltipButtonTop = 10;
        }
        
        // Ensure button doesn't go off the right edge
        if (this.tooltipButtonLeft > window.innerWidth - 120) {
            this.tooltipButtonLeft = window.innerWidth - 120;
        }
        
        // Ensure button doesn't go off the bottom edge
        if (this.tooltipButtonTop > window.innerHeight - 50) {
            this.tooltipButtonTop = window.innerHeight - 50;
        }
        
        console.log('Button positioned at:', { left: this.tooltipButtonLeft, top: this.tooltipButtonTop, fieldType });
    }

    calculateTooltipPosition(fieldType: string, event: any) {
        const targetElement = event.target;
        const rect = targetElement.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        
        // Default position
        let position = 'bottom';
        
        // Check if there's enough space below
        if (rect.bottom + 250 > viewportHeight) {
            position = 'top';
        }
        
        // Check if there's enough space to the right
        if (rect.left + 250 > viewportWidth) {
            if (position === 'top') {
                position = 'top left';
            } else {
                position = 'bottom left';
            }
        }
        
        // For subject and preview fields, prefer top positioning to avoid covering the input
        if (fieldType === 'subject' || fieldType === 'preview') {
            if (rect.top > 250) {
                position = 'top';
            }
        }
        
        this.tooltipPosition = position;
    }
    onESC(event: KeyboardEvent) {
        const fullscreen = document.querySelector('.cke_maximized');
        if (fullscreen) {
            event.stopPropagation();
        
    //   const isFullscreen = document.querySelector('.cke_maximized') !== null;
    //   if (isFullscreen) {
    //     // Let CKEditor handle it, prevent dialog from closing
    //     event.stopPropagation();
      } else {
        // Manually close dialog when not fullscreen
        this.dialogRef.close();
      }
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
                id: "genrateAIOptions",
                title: this.processing
                    ? this.ls.l("Generate")
                    : this.ls.l("Write with AI"),
                class: "ai-genrate-btn",
                action: this.toggleAIPrompt.bind(this),
            },
            {
                id: "saveTemplateOptions",
                title: "Send Email Message", // this.data.saveTitle,
                disabled: this.templateEditMode && this.isManageUnallowed,
                class: "primary",
                action: this.save.bind(this),
                // contextMenu: {
                //     hidden: this.data.hideContextMenu,
                //     items: this.saveButtonOptions,
                //     cacheKey: this.cacheHelper.getCacheKey(
                //         "save_option_active_index",
                //         "EmailTemplateDialog",
                //     ),
                //     defaultIndex: 0,
                // },
            },
            // {
            //     id: 'refreshOptions',
            //     title: '',
            //     class: 'refresh-button',
            //     action: () => this.close()
            // },
        ];
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
    save(event?) {
        if (this.ckEditor.mode == "source") this.ckEditor.execCommand("source");

        if (event && event.offsetX > event.target.offsetWidth - 32)
            return this.addEmailComponent.instance.option("visible", true);

        setTimeout(() => {
            if (this.validateData()) {
                this.storeAttachmentsToDocumentsCache();
                this.data.attachments = [];
                if (
                    this.attachments.every((item: Partial<EmailAttachment>) => {
                        if (item.loader)
                            this.notifyService.info(
                                this.ls.l("AttachmentsUploadInProgress"),
                            );
                        else this.data.attachments.push(item);
                        return !item.loader;
                    })
                )
                    if (this.templateEditMode) this.saveTemplateData();
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
                    this.ls.l("RequiredField", this.ls.l("Template")),
                );
            }

            if (
                this.data.templateType == EmailTemplateType.WelcomeEmail &&
                !this.data.subject
            )
                return this.notifyService.error(
                    this.ls.l("RequiredField", this.ls.l("Subject")),
                );
        } else {
            let validate = this.validationGroup.instance.validate();
            if (!validate.isValid)
                return validate.brokenRules.forEach((rule) => {
                    this.notifyService.error(rule.message);
                });

            if (!this.fromDataSource.length)
                return this.notifyService.error(
                    this.ls.l(
                        "MailerSettingsAreNotConfigured",
                        this.ls.l("SMTP"),
                    ),
                    this.ls.l("RequiredField", this.ls.l("From")),
                );

            if (!this.data.to || !this.data.to.length)
                return this.notifyService.error(
                    this.ls.l("RequiredField", this.ls.l("To")),
                );

            if (!this.data.subject)
                return this.notifyService.error(
                    this.ls.l("RequiredField", this.ls.l("Subject")),
                );
        }

        if (!this.data.body)
            return this.notifyService.error(
                this.ls.l("RequiredField", this.ls.l("Body")),
            );

        return true;
    }

    saveTemplateData() {
        this.forceValidationBypass = false;
        if (this.validator.instance.validate().isValid) {
            let attachments = [];
            if (this.data.attachments) {
                attachments = this.data.attachments.map((item) => {
                    return new FileInfo({
                        id: item.fileId || item.id,
                        name: item.name,
                    });
                });
            }

            let templateId =
                    this.data.templateId || this.lastSelectedTemplateId,
                isUpdating =
                    templateId && !this.data.addMode && !this.isSaveAsNew(),
                data = {
                    id: isUpdating ? templateId : undefined,
                    name: this.getTemplateName(),
                    type: this.data.templateType,
                    subject: this.data.subject,
                    cc: this.data.cc,
                    bcc: this.data.bcc,
                    previewText: this.data.previewText,
                    body: this.data.body,
                    attachments: attachments,
                };

            this.startLoading();
            let request$: Observable<any> = isUpdating
                ? this.emailTemplateProxy.update(
                      new UpdateEmailTemplateRequest(data),
                  )
                : this.emailTemplateProxy.create(
                      new CreateEmailTemplateRequest(data),
                  );

            request$
                .pipe(finalize(() => this.finishLoading()))
                .subscribe((id: number) => {
                    if (id) {
                        this.data.templateId = id;
                        if (this.customItem) this.customItem.id = id;
                    }
                    this.data.attachments.map((item) => {
                        item.fromTemplate = true;
                        delete item.loader;
                    });
                    this.onSave.emit(this.data);

                    if (this.isSaveAndClose()) this.close();
                    else this.refresh();
                });
        } else {
            this.templateComponent.instance.option("isValid", false);
        }
        this.forceValidationBypass = true;
    }

    isSaveAsNew() {
        return this.saveButtonOptions.some((item) => {
            return item.selected && item.text == this.ls.l("SaveAsNew");
        });
    }

    isSaveAndClose() {
        return this.saveButtonOptions.some((item) => {
            return item.selected && item.text == this.ls.l("SaveAndClose");
        });
    }

    getTemplateName() {
        return this.templateComponent.instance.field()["value"];
    }

    refresh() {
        this._refresh.next(null);
    }

    onTagBoxInitialized(event) {
        if (
            !event.component.option("dataSource") ||
            !event.component.option("dataSource").length
        )
            event.component.option("openOnFieldClick", false);
    }

    emailInputFocusOut(event, checkDisplay?) {
        event.text = this.tagLastValue || event.event.target.value;
        this.tagLastValue = "";
        this.onCustomItemCreating(event, (field) => {
            let isComboListEmpty = !this.data[field].length;
            if (
                checkDisplay &&
                isComboListEmpty &&
                !event.component.field().value
            ) {
                if (field == "cc") this.showCC = false;
                else this.showBCC = false;
                this.changeDetectorRef.detectChanges();
            } else if (field == "to" && isComboListEmpty)
                event.component.option("isValid", false);
        });
    }
    onValueChanged(event, field) {
        this[field] = event.value && event.value.length > 0;
    }
    showInputField(element, field) {
        this[field] = !this[field];
        setTimeout(() => element.instance.focus());
        this.changeDetectorRef.detectChanges();
    }



    startLoading() {
        this.modalDialog && this.modalDialog.startLoading();
    }

    finishLoading() {
        this.modalDialog && this.modalDialog.finishLoading();
    }

    extendDefaultValidator(e) {
        const defaultAdapter = e.component.option("adapter");
        const forceValidationBypass = this.forceValidationBypass;
        const newAdapter = $.extend({}, defaultAdapter, {
            bypass: function () {
                return forceValidationBypass || this.editor.option("disabled");
            },
        });
        e.component.option("adapter", newAdapter);
    }

    onValidationGroupInitialized(e: any) {
        // Initialize validation group with bypass mechanism
        if (e.component) {
            // Store reference to validation group if needed
            console.log('Validation group initialized');
        }
    }

    onTemplateChanged(event) {
        if (event.value) this.templateComponent.isValid = true;
        if ((this.data.templateId = event.value)) this.customItem = undefined;
        if (event.value) {
            if (this.templateEditMode) this.loadTemplateById(event.value);
            else this.onTemplateChange.emit(event.value);
        }
    }

    loadTemplateById(templateId: number) {
        if (!this.templateEditMode) return;

        this.startLoading();
        this.emailTemplateProxy
            .getTemplate(templateId)
            .pipe(finalize(() => this.finishLoading()))
            .subscribe((res: GetTemplateReponse) => {
                if (this.showTemplate) {
                    this.templateData.body = res.body;
                    this.templateData.subject = res.subject;
                    this.templateData.previewText = res.previewText;
                    this.templateData.attachments = res.attachments;
                } else {
                    this.data.bcc = res.bcc;
                    this.data.body = res.body;
                    this.data.cc = res.cc;
                    this.data.subject = res.subject;
                    this.data.previewText = res.previewText;
                    this.showCC = Boolean(res.cc && res.cc.length);
                    this.showBCC = Boolean(res.bcc && res.bcc.length);
                    this.updateTemplateAttachments(res.attachments);
                    this.onTemplateChange.emit(templateId);
                }

                this.invalidate();
                this.templateLoaded = true;
            });
    }
    viewDetailTemplate(event, data) {
        this.templateEditMode = true;
        this.curTemplateTitle = data.name;
        this.curTemplateId = data.id;
        this.showTabs("template");
        this.loadTemplateById(data.id);
    }
    async setTemplate() {
        this.data.body = this.templateData.body;
        this.data.subject = this.templateData.subject;
        this.data.previewText = this.templateData.previewText;
        this.attachments = this.templateData.attachments;
        this.aceEditor.session.setValue(
            // this.aceEditor.getCursorPosition(),
            this.templateData.body,
        );
        await this.formatCode();
        // this.templateForm.get('emailContentBodyTemplate')?.setValue(this.templateData.body);
        this.templateEditMode = false;

        this.showTabs("new-email");
    }
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
            }),
        );
    }

    removeTemplateAttachments() {
        this.attachments = this.attachments.filter((v) => !v.fromTemplate);
    }

    validateEmailList(element) {
        return (event) => {
            return (
                element.instance.field() === document.activeElement ||
                !event.value ||
                !element.instance.field().value
            );
        };
    }

    invalidate() {
        this.updateDataLength();
        this.changeDetectorRef.markForCheck();
    }

    onFromChanged(event) {
        let from = this.fromDataSource.find(
            (item) => item.emailSettingsSource == event.value,
        );
        if (from) {
            if (this.data.cc && this.data.cc.length)
                this.fromDataSource.forEach((item) => {
                    let index = this.data.cc.indexOf(item.ccEmailAddress);
                    if (index >= 0) this.data.cc.splice(index, 1);
                });
            this.checkUpdateCCFromEmail(from);
        }
    }

    onCustomItemCreating(event, callback?) {
        let field = event.component.option("name"),
            values = event.text
                .trim()
                .split(/[,|;]+(?=(?:(?:[^"]*"){2})*[^"]*$)/),
            validValues = [],
            invalidValues = [],
            currentList = this.data[field];

        values.forEach((item) => {
            if (AppConsts.regexPatterns.emailWithName.test(item))
                validValues.push(item);
            else if (item.trim()) invalidValues.push(item);
        });

        validValues = validValues.filter((item, pos) => {
            return (
                validValues.indexOf(item) == pos &&
                (!currentList || currentList.indexOf(item) < 0)
            );
        });

        if (invalidValues.length) {
            event.component.option("isValid", false);
            setTimeout(
                () => (event.component.field().value = invalidValues.join(",")),
            );
        } else event.component.option("isValid", true);

        setTimeout(() => {
            if (currentList)
                Array.prototype.push.apply(currentList, validValues);
            else this.data[field] = validValues;
            callback && callback(field);
            this.changeDetectorRef.markForCheck();
        });
        event.customItem = "";
    }

    onNewTemplate(event) {
        this.lastSelectedTemplateId = this.data.templateId;
        if (event.text) this.templateComponent.isValid = true;
        this.customItem = event.customItem = {
            name: event.text,
            id: undefined,
        };
    }

    onTemplateOptionChanged(event) {
        if (event.name == "selectedItem" && !event.value) {
            this.reset();
            this.changeDetectorRef.detectChanges();
            setTimeout(() => {
                event.component.option("isValid", true);
                event.component.focus();
                this.invalidate();
            });
        }
    }

    reset() {
        this.data.cc = this.data.bcc = [];
        this.data.subject = this.data.body = "";
        this.removeTemplateAttachments();
    }

    onCKReady(event) {
        if (window["CKEDITOR"] && window["CKEDITOR"].warn) {
            window["CKEDITOR"].warn = function () {};
        }
        this.ckEditor = event.editor;
        const iframe = this.ckEditor.container.$.querySelector('iframe');
        if (iframe) {
            this.ckEditorDocument = iframe.contentDocument || iframe.contentWindow?.document || null;
            if (this.ckEditorDocument) {
                this.ckEditorDocument.addEventListener('click', this.handleCKEditorClick.bind(this));
            }
        }
        
        // If CKEditor is already focused, add cursor tracking
        if (this.currentFocusedField === 'ckeditor') {
            this.addCKEditorCursorTracking();
        }
        
        // Add content change listener to update button position
        if (this.ckEditor && this.ckEditor.instance) {
            this.ckEditor.instance.on('change', this.onCKEditorContentChange.bind(this));
        }
        
        // Setup additional CKEditor event listeners
        this.setupCKEditorEventListeners();
        
        console.log('CKEditor ready, instance:', this.ckEditor);
    }
    
    onCKEditorContentChange(event: any) {
        // Update button position when content changes in CKEditor
        if (this.currentFocusedField === 'ckeditor' && this.ckEditor) {
            console.log('CKEditor content changed, updating button position');
            this.calculateButtonPosition('ckeditor', { target: this.ckEditor.container.$ });
            this.changeDetectorRef.detectChanges();
        }
    }

    updateDataLength() {
        this.templateForm = this.fb.group({
            emailContentBodyTemplate: [this.data.body],
        });
        if (this.data.body) {
            this.charCount =
                Math.max(
                    this.data.body.replace(/(<([^>]+)>|\&nbsp;)/gi, "").length -
                        1,
                    0,
                ) ?? 0;
            
            this.changeDetectorRef.markForCheck();
        }
    }

    onTagClick(event) {
        console.log('onTagClick called with:', { event, currentFocusedField: this.currentFocusedField });
        
        if (this.onTagItemClick.observers.length)
            this.onTagItemClick.emit(event.itemData);
        else if (this.templateEditMode) {
            if (event.itemData == EmailTags.SenderCompanyLogo)
                this.insertImageElement("#" + event.itemData + "#");
            else this.addTextTag(event.itemData);
        } else {
            let value = this.getTagValue(event.itemData);
            console.log('Tag value:', value);
            
            if (value) {
                if (event.itemData == EmailTags.SenderCompanyLogo) {
                    this.insertImageElement(value);
                } else if (event.itemData == EmailTags.SenderEmailSignature) {
                    this.insertHtml(value);
                } else {
                    // Ensure we have the current focused field before inserting
                    if (this.currentFocusedField) {
                        console.log('Inserting tag into focused field:', this.currentFocusedField);
                        this.insertTagIntoFocusedField(value);
                    } else {
                        console.log('No field focused, falling back to CKEditor');
                        // Fallback to CKEditor if no field is focused
                        this.insertTagIntoCKEditor(value);
                    }
                }
            }
        }

        this.invalidate();
        this.isTagsTooltipVisible = false;
        
        // Keep the button visible for a longer time after tag insertion
        // so the user can see the tag was inserted and continue using it
        setTimeout(() => {
            // Only hide the button if no field is focused and tooltip is closed
            if (!this.currentFocusedField && !this.isTagsTooltipVisible) {
                this.currentFocusedField = '';
                this.currentFocusedElement = null;
                this.changeDetectorRef.detectChanges();
            }
        }, 1000); // Increased to 1 second for better UX
    }

    insertTagIntoFocusedField(tagValue: string) {
        console.log('insertTagIntoFocusedField called with:', { tagValue, currentFocusedField: this.currentFocusedField });
        
        switch (this.currentFocusedField) {
            case 'subject':
                console.log('Inserting tag into subject field');
                this.insertTagIntoSubject(tagValue);
                break;
            case 'preview':
                console.log('Inserting tag into preview field');
                this.insertTagIntoPreview(tagValue);
                break;
            case 'ckeditor':
                console.log('Inserting tag into CKEditor');
                this.insertTagIntoCKEditor(tagValue);
                break;
            default:
                console.log('No field focused, falling back to CKEditor');
                // Fallback to CKEditor if no field is focused
                this.insertTagIntoCKEditor(tagValue);
                break;
        }
    }

    insertTagIntoSubject(tagValue: string) {
        if (this.subjectField && this.subjectField.instance) {
            const currentValue = this.data.subject || '';
            const cursorPosition = this.subjectField.instance.option('value')?.length ||0;
            const newValue = currentValue.slice(0, cursorPosition) + tagValue + currentValue.slice(cursorPosition);
            this.data.subject = newValue;
            this.subjectField.instance.option('value', newValue);
            
            // Set cursor position after the inserted tag
            setTimeout(() => {
                this.subjectField.instance.focus();
                const newCursorPosition = cursorPosition + tagValue.length;
                this.subjectField.instance.option('value', newValue);
                // Note: DevExtreme TextBox doesn't support cursor positioning directly
                // The tag will be inserted at the end for now
            }, 100);
        }
    }

    insertTagIntoPreview(tagValue: string) {
        if (this.PreviewTextElement && this.PreviewTextElement.instance) {
            const currentValue = this.data.previewText || '';
            const cursorPosition = this.PreviewTextElement.instance.option('value')?.length || 0;
            const newValue = currentValue.slice(0, cursorPosition) + tagValue + currentValue.slice(cursorPosition);
            this.data.previewText = newValue;
            this.PreviewTextElement.instance.option('value', newValue);
            
            // Set cursor position after the inserted tag
            setTimeout(() => {
                this.PreviewTextElement.instance.focus();
                const newCursorPosition = cursorPosition + tagValue.length;
                this.PreviewTextElement.instance.option('value', newValue);
                // Note: DevExtreme TextBox doesn't support cursor positioning directly
                // The tag will be inserted at the end for now
            }, 100);
        }
    }

    insertTagIntoCKEditor(tagValue: string) {
        if (this.ckEditor) {
            if (this.selectedTab === "html-editor") {
                this.data.body += "<div>" + tagValue + "</div>";
            } else {
                this.ckEditor.insertText(tagValue);
            }
        }
    }

    getTagValue(name) {
        let value = this.data.tags && this.data.tags[name];
        if (name == EmailTags.SenderPhone && value)
            value = this.phonePipe.transform(value);

        if (!value && this.data.contactIds) value = "#" + name + "#";

        return value;
    }

    getWebsiteLinks(list) {
        return list.filter(
            (item) => item.linkTypeId == this.WEBSITE_LINK_TYPE_ID,
        );
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
        if (this.selectedTab === "html-editor") {
            this.data.body += "<div>" + text + "</div>";
        } else {
            this.ckEditor.insertText(text);
        }
    }

    addTextTag(tag: string) {
        if (this.selectedTab === "html-editor") {
            this.data.body += "<div>" + tag + "</div>";
        } else {
            this.insertText("#" + tag + "#");
        }
    }

    addLinkTag(tag: string, link: string) {
        this.ckEditor.insertHtml('<a href="#' + tag + '#">' + link + "</a>");
    }

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
            URL.createObjectURL(file),
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
                    (item) => item.name != file.name,
                );
                this.notifyService.error(res.error.message);
                this.changeDetectorRef.markForCheck();
            },
            () => {
                attachment.loader = undefined;
                this.changeDetectorRef.markForCheck();
            },
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
                    "/api/services/CRM/ContactCommunication/SaveAttachment",
            );
            xhr.setRequestHeader(
                "Authorization",
                "Bearer " + abp.auth.getToken(),
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

    createTemplate() {
        // this.onTemplateCreate.emit();
        this.openCreateOrEditTemplate();
    }

    editTemplate(event, id: number): void {
        this.openCreateOrEditTemplate(id);
    }

    dialogSaveCallback(data) {
        this._refresh.next();
        this.internalTemplateId = data.templateId;
    }
    deleteTemplate(event, template) {
        // component.instance.option('opened', false);
        abp.message.confirm(
            this.ls.l("DeleteItemConfirmation", template.name),
            "",
            (isConfimed) => {
                if (isConfimed) {
                    this.startLoading();
                    this.emailTemplateProxy
                        .delete(template.id)
                        .pipe(finalize(() => this.finishLoading()))
                        .subscribe(() => {
                            this.notifyService.success(
                                this.ls.l("SuccessfullyDeleted"),
                            );
                            this.refresh();
                            if (this.curTemplateId === template.id) {
                                this.curTemplateId = null;
                                this.data.templateId = null;
                                this.templateData.attachments = null;
                                this.templateData.body = "";
                                this.templateData.previewText = "";
                                this.curTemplateTitle = "";
                                this.templateData.subject = "";
                            }
                            this.onTemplateDelete.emit(template.id);
                        });
                }
            },
        );

        event.stopPropagation();
        event.preventDefault();
    }

    openDocuments() {
        const templateDocumentsDialogData: TemplateDocumentsDialogData = {
            fullHeight: true,
            contactId: this.data.contact && this.data.contact.id,
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
                        }),
                    );

                    this.changeDetectorRef.detectChanges();
                }
            });
    }

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

    storeAttachmentsToDocumentsCache() {
        this.cacheService.set(
            this.cacheHelper.getCacheKey(
                this.storeAttachmentsToDocumentsCacheKey,
            ),
            this.data.saveAttachmentsToDocuments,
        );
    }

    getAttachmentsToDocumentsCache(): boolean {
        let key = this.cacheHelper.getCacheKey(
            this.storeAttachmentsToDocumentsCacheKey,
        );
        if (this.cacheService.get(key) == false) return false;

        return true;
    }

    getTagText(data: EmailTags) {
        if (data == EmailTags.InvoiceLink) return "Invoice PDF Link";
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
        const pasteContent = event.clipboardData?.getData("text/plain");
        document.execCommand("insertText", false, pasteContent);
        this.editorContent = (event.target as HTMLElement).innerText;
        this.invalidate();
    }



    getChatGptResponse() {
        this.processing = true;
        this.updateButtons();

        const prompt = this.groupedPromptLibrary[this.selectedPromptGroupIndex]?.prompts[this.selectedPromptItemIndex]?.prompt;
        const model = this.aiModels.find((item: any) => item.id == this.selectedItemId)?.model ?? 'gpt-3.5-turbo';

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
            console.log('ChatGPT Response:', data);
            this.processing = false;

            // Temporarily disable validation to prevent premature triggering
            this.forceValidationBypass = true;

            const gptResponse = data.response;
            const responseData = this.extractContent(gptResponse);
            this.data.subject = responseData.subject;
            this.data.body = this.formatEmailContent(responseData.body) as unknown as string;
            this.aceEditor.session.setValue(this.data.body);
            this.formatCode();
            
            // Trigger change detection after all data is updated
            this.changeDetectorRef.detectChanges();
            
            // Re-enable validation after content is inserted and change detection is complete
            this.changeDetectorRef.detectChanges();
            this.forceValidationBypass = false;
            this.invalidate();

            this.updateButtons();
        })
        .catch(error => {
            this.processing = false;
            console.error('Error calling ChatGPT Function:', error);
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
            // .replace(/\n/g, "<br>")
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

    showTabs(tabName: string) {
        this.selectedTab = tabName;
        this.showNewEmailTab = false;
        this.showHtmlEditor = false;
        this.showTemplate = false;
        if (tabName == "new-email") {
            this.showNewEmailTab = true;
            this.title = "New Email";
            // Sync HTML editor content back to CKEditor
            if (this.aceEditor && this.aceEditor.getValue()) {
                this.data.body = this.aceEditor.getValue();
                this.updateDataLength();
                this.changeDetectorRef.detectChanges();
            }
        } else if (tabName == "html-editor") {
            this.showHtmlEditor = true;
            this.title = "Html Editor";
            // Sync CKEditor content to HTML editor
            if (this.aceEditor && this.data.body) {
                this.aceEditor.session.setValue(this.data.body);
            }
            setTimeout(() => {
                this.aceEditor.resize();
                // Ensure content is synced after resize
                if (this.aceEditor && this.data.body) {
                    this.aceEditor.session.setValue(this.data.body);
                }
                // Auto-format the code when switching to HTML editor tab
                if (this.aceEditor && this.aceEditor.getValue()) {
                    this.formatCode();
                }
            }, 0);
        } else if (tabName == "template") {
            this.showTemplate = true;
            this.title = "Template";
        }
    }

    updateEditor(): void {
        // Triggered when textarea content changes
    }

    syncHtmlEditorContent(): void {
        // Manually sync content between HTML editor and CKEditor
        if (this.aceEditor && this.data.body) {
            this.aceEditor.session.setValue(this.data.body);
        }
    }

    syncCKEditorContent(): void {
        // Manually sync content from HTML editor to CKEditor
        if (this.aceEditor && this.aceEditor.getValue()) {
            this.data.body = this.aceEditor.getValue();
            this.updateDataLength();
            this.changeDetectorRef.detectChanges();
        }
    }

    onPromptTooltipWheel(event: WheelEvent): void {
        // Handle mouse wheel scrolling for the prompt library tooltip
        event.preventDefault();
        event.stopPropagation();
        
        const tooltipContent = event.currentTarget as HTMLElement;
        if (tooltipContent) {
            const scrollAmount = event.deltaY > 0 ? 30 : -30;
            tooltipContent.scrollTop += scrollAmount;
        }
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

    generateAIMessage() {
        this.getChatGptResponse();
    }

    cancelAIMessage() {
        this.showAIPrompt = false;
    }

    toggleAIPrompt() {
        this.showAIPrompt = !this.showAIPrompt;
    }

    openModal(): void {
        this.crmService.openDialog();
    }

    // toggle placeholder text

    onFocusIn() {
        this.placeholderText = "";
    }
    onFocusOut() {
        this.placeholderText = "Search templates";
    }

    onSearchInput(event: any) {
        const searchValue = event.event?.target?.value?.toLowerCase() || "";
        this.searchTerm = searchValue;
        
        // Clear previous timer and set new one for debouncing
        if (this.searchDebounceTimer) {
            clearTimeout(this.searchDebounceTimer);
        }
        
        this.searchDebounceTimer = setTimeout(() => {
            this.updateFilteredTemplates(searchValue);
        }, 300); // 300ms debounce delay
    }
    private updateFilteredTemplates(searchValue: string) {
        if (!searchValue.trim()) {
            // If no search term, show all templates
            this.filteredTemplates$.next(this.cachedTemplates);
            return;
        }
        
        // Filter from cached templates (client-side filtering)
        const filtered = this.cachedTemplates.filter(
            template => template.name.toLowerCase().includes(searchValue.toLowerCase())
        );
        this.filteredTemplates$.next(filtered);
    }

    onSearchChange(event: any) {
        const searchValue = event.value?.toLowerCase() || "";
        this.searchTerm = searchValue;
        
        // Clear previous timer and set new one for debouncing
        if (this.searchDebounceTimer) {
            clearTimeout(this.searchDebounceTimer);
        }
        
        this.searchDebounceTimer = setTimeout(() => {
            this.updateFilteredTemplates(searchValue);
        }, 300); // 300ms debounce delay
    }

    toggleSetting() {
        this.showSetting = !this.showSetting;
    }

    updateEditorSettings(): void {
        this.aceEditor.setOptions({
            fontSize: this.editorSettings.fontSize,
            theme: this.editorSettings.theme,
            showLineNumbers: this.editorSettings.showLineNumbers,
            showGutter: this.editorSettings.showLineNumbers,
            showPrintMargin: this.editorSettings.showPrintMargin,
        });

        this.editorColor = this.editorThemes.find(
            (i: any) => i.value === this.editorSettings.theme,
        ).color;
        this.aceEditor.resize(true);
        this.aceEditor.renderer.setScrollMargin(10, 0);
        this.aceEditor.renderer.updateFull();
        this.changeDetectorRef.detectChanges();
    }

    async formatCode() {
        const code = this.aceEditor.getValue(); 

        const formattedString =await prettier.format(code, {
            parser: "html", 
            plugins: [parserHtml,prettierPluginVoidHtml],
            tabWidth: 2,
            useTabs: false,
            printWidth: 120,
            endOfLine: "lf",
        });
        this.aceEditor.setValue(formattedString as unknown as string, -1); //
    }

    abbrTitle (title: string) :string {
        if(title){
            if (title.length <= 50) {
                return title;
            }
            return title.substring(0, 50) + '...';
        } 
        else return title;
    }

    ngOnDestroy() {
        // Clean up event listeners to prevent memory leaks
        if (this.ckEditorDocument) {
            this.ckEditorDocument.removeEventListener('click', this.handleCKEditorClick.bind(this));
        }
        
        // Clean up cursor tracking
        this.removeCursorTracking();
        
        // Clean up CKEditor cursor tracking
        this.removeCKEditorCursorTracking();
        
        // Clean up search debounce timer
        if (this.searchDebounceTimer) {
            clearTimeout(this.searchDebounceTimer);
        }
        
        // Clean up window resize listener
        window.removeEventListener('resize', this.onWindowResize.bind(this));
    }

    onTagButtonClick(event: any) {
        // Prevent the button from disappearing when clicked
        event.stopPropagation();
        event.preventDefault();
        
        // Get the current focused field type
        const fieldType = this.currentFocusedField;
        
        if (fieldType) {
            // Show the tooltip
            this.showTagsTooltip(fieldType, event);
        } else {
            // If no field is focused, default to CKEditor
            this.currentFocusedField = 'ckeditor';
            this.showTagsTooltip('ckeditor', event);
        }
    }

    addCKEditorCursorTracking() {
        // Add special handling for CKEditor
        console.log('Adding CKEditor cursor tracking');
        
        if (this.ckEditor && this.ckEditor.instance) {
            // Listen for cursor movement in CKEditor
            this.ckEditor.instance.on('selectionChange', this.onCKEditorCursorMove.bind(this));
            this.ckEditor.instance.on('click', this.onCKEditorCursorMove.bind(this));
            this.ckEditor.instance.on('keyup', this.onCKEditorCursorMove.bind(this));
            this.ckEditor.instance.on('input', this.onCKEditorCursorMove.bind(this));
            this.ckEditor.instance.on('keydown', this.onCKEditorCursorMove.bind(this));
        }
    }
    
    removeCKEditorCursorTracking() {
        if (this.ckEditor && this.ckEditor.instance) {
            // Remove event listeners
            this.ckEditor.instance.off('selectionChange', this.onCKEditorCursorMove.bind(this));
            this.ckEditor.instance.off('click', this.onCKEditorCursorMove.bind(this));
            this.ckEditor.instance.off('keyup', this.onCKEditorCursorMove.bind(this));
            this.ckEditor.instance.off('input', this.onCKEditorCursorMove.bind(this));
            this.ckEditor.instance.off('keydown', this.onCKEditorCursorMove.bind(this));
            this.ckEditor.instance.off('change', this.onCKEditorContentChange.bind(this));
        }
    }
    
    onCKEditorCursorMove(event: any) {
        // Update button position when cursor moves in CKEditor
        if (this.currentFocusedField === 'ckeditor' && this.ckEditor) {
            console.log('CKEditor cursor moved, updating button position', { event, ckEditor: this.ckEditor });
            this.calculateButtonPosition('ckeditor', { target: this.ckEditor.container.$ });
            this.changeDetectorRef.detectChanges();
        } else {
            console.log('CKEditor cursor moved but not focused or not ready', { 
                currentFocusedField: this.currentFocusedField, 
                ckEditor: this.ckEditor 
            });
        }
    }

    // Method to manually trigger CKEditor focus (can be called from template or other methods)
    onCKEditorFocus(event: any) {
        console.log('CKEditor manually focused:', event);
        
        // Set the current focused field
        this.currentFocusedField = 'ckeditor';
        this.currentFocusedElement = event.target || this.ckEditor?.container?.$;
        
        // Calculate button position immediately
        this.calculateButtonPosition('ckeditor', { target: this.ckEditor?.container?.$ || event.target });
        
        // Add cursor tracking
        this.addCKEditorCursorTracking();
        
        // Force change detection
        this.changeDetectorRef.detectChanges();
        
        console.log('CKEditor focus handled, button should be visible at:', { 
            left: this.tooltipButtonLeft, 
            top: this.tooltipButtonTop 
        });
    }
    
    // Method to ensure button is visible and positioned correctly for CKEditor
    ensureCKEditorButtonVisible() {
        if (this.currentFocusedField === 'ckeditor' && this.ckEditor) {
            console.log('Ensuring CKEditor button is visible and positioned correctly');
            this.calculateButtonPosition('ckeditor', { target: this.ckEditor.container.$ });
            this.changeDetectorRef.detectChanges();
        }
    }

    // Method to log current state for debugging
    logCurrentState() {
        console.log('Current state:', {
            currentFocusedField: this.currentFocusedField,
            currentFocusedElement: this.currentFocusedElement,
            ckEditor: this.ckEditor,
            tooltipButtonLeft: this.tooltipButtonLeft,
            tooltipButtonTop: this.tooltipButtonTop,
            isTagsTooltipVisible: this.isTagsTooltipVisible,
            tagsList: this.tagsList
        });
    }

    // Method to force refresh button position
    forceRefreshButtonPosition() {
        if (this.currentFocusedField && this.currentFocusedElement) {
            console.log('Force refreshing button position for:', this.currentFocusedField);
            this.calculateButtonPosition(this.currentFocusedField, { target: this.currentFocusedElement });
            this.changeDetectorRef.detectChanges();
        }
    }
    
    // Method to handle window resize
    onWindowResize() {
        console.log('Window resized, updating button position');
        this.forceRefreshButtonPosition();
    }

    // Method to handle manual CKEditor clicks
    onCKEditorClick(event: any) {
        console.log('CKEditor manually clicked:', event);
        
        // Set the current focused field
        this.currentFocusedField = 'ckeditor';
        this.currentFocusedElement = event.target || this.ckEditor?.container?.$;
        
        // Calculate button position immediately
        this.calculateButtonPosition('ckeditor', { target: this.ckEditor?.container?.$ || event.target });
        
        // Add cursor tracking if not already added
        this.addCKEditorCursorTracking();
        
        // Force change detection
        this.changeDetectorRef.detectChanges();
        
        console.log('CKEditor click handled, button should be visible at:', { 
            left: this.tooltipButtonLeft, 
            top: this.tooltipButtonTop 
        });
    }

    // Method to handle manual CKEditor focus by tabbing or other methods
    onCKEditorManualFocus(event: any) {
        console.log('CKEditor manually focused by tabbing or other method:', event);
        
        // Set the current focused field
        this.currentFocusedField = 'ckeditor';
        this.currentFocusedElement = event.target || this.ckEditor?.container?.$;
        
        // Calculate button position immediately
        this.calculateButtonPosition('ckeditor', { target: this.ckEditor?.container?.$ || event.target });
        
        // Add cursor tracking if not already added
        this.addCKEditorCursorTracking();
        
        // Force change detection
        this.changeDetectorRef.detectChanges();
        
        console.log('CKEditor manual focus handled, button should be visible at:', { 
            left: this.tooltipButtonLeft, 
            top: this.tooltipButtonTop 
        });
    }

    // Method to handle CKEditor instance events
    setupCKEditorEventListeners() {
        if (this.ckEditor && this.ckEditor.instance) {
            // Listen for various CKEditor events that might affect button positioning
            this.ckEditor.instance.on('instanceReady', () => {
                console.log('CKEditor instance ready, setting up event listeners');
                this.forceRefreshButtonPosition();
            });
            
            this.ckEditor.instance.on('focus', () => {
                console.log('CKEditor instance focused');
                this.currentFocusedField = 'ckeditor';
                this.forceRefreshButtonPosition();
            });
            
            this.ckEditor.instance.on('blur', () => {
                console.log('CKEditor instance blurred');
                // Don't immediately clear currentFocusedField to allow for button clicks
            });
        }
    }

}

