/** Core imports */
import {
    AfterViewInit,
    Component,
    Injector,
    HostListener,
    OnInit,
    OnDestroy,
    ViewChild,
    ViewChildren,
    ElementRef,
    Renderer2,
    QueryList,
} from "@angular/core";

/** Third party imports */
import { MatDialog } from "@angular/material/dialog";
import { DxDataGridComponent } from "devextreme-angular/ui/data-grid";
import "devextreme/data/odata/store";
import { ImageViewerComponent } from "ng2-image-viewer";
import { Observable, BehaviorSubject, combineLatest, from, of } from "rxjs";
import {
    first,
    filter,
    finalize,
    flatMap,
    tap,
    pluck,
    map,
    takeUntil,
    switchMap,
    mapTo,
} from "rxjs/operators";
import { CacheService } from "ng2-cache-service";
import * as xmlJs from "xml-js";
import values from "lodash/values";
import JSONFormatter from "json-formatter-js";
import * as jszip from "jszip";
import * as Rar from "rarjs/rar.js";
import { Papa } from "ngx-papaparse";
import { PapaParseResult } from "ngx-papaparse/lib/interfaces/papa-parse-result";
import * as moment from "moment-timezone";

/** Application imports */
import { AppConsts } from "@shared/AppConsts";
import { AppComponentBase } from "@shared/common/app-component-base";
import {
    ContactServiceProxy,
    ContactInfoDto,
    DocumentServiceProxy,
    DocumentInfo,
    DocumentTypeServiceProxy,
    DocumentTypeInfo,
    UpdateTypeInput,
    WopiRequestOutcoming,
    LeadInfoDto,
} from "@shared/service-proxies/service-proxies";
import { FileSizePipe } from "@shared/common/pipes/file-size.pipe";
import { PrinterService } from "@shared/common/printer/printer.service";
import { StringHelper } from "@shared/helpers/StringHelper";
import { DocumentType } from "./document-type.enum";
import { ContactsService } from "../contacts.service";
import { NotSupportedTypeDialogComponent } from "@app/crm/contacts/documents/not-supported-type-dialog/not-supported-type-dialog.component";
import { DocumentsService } from "@app/crm/contacts/documents/documents.service";
import { DocumentViewerType } from "@app/crm/contacts/documents/document-viewer-type.enum";
import { RequestHelper } from "@root/shared/helpers/RequestHelper";
import { ActionMenuComponent } from "@app/shared/common/action-menu/action-menu.component";
import { ActionMenuItem } from "@app/shared/common/action-menu/action-menu-item.interface";
import { ToolbarGroupModel } from "@app/shared/common/toolbar/toolbar.model";
import { FiltersService } from '@shared/filters/filters.service';
import { AppService } from "@app/app.service";
import { DocumentTabsFilter, DocumentViewTypeFilter } from './documents-dto.interface';
import { DataLayoutType } from "@app/shared/layout/data-layout-type";


@Component({
    templateUrl: "./documents.component.html",
    styleUrls: ["./documents.component.less"],
    providers: [FileSizePipe, PrinterService],
})
export class DocumentsComponent
    extends AppComponentBase
    implements AfterViewInit, OnInit, OnDestroy
{
    @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;
    @ViewChild(ImageViewerComponent) imageViewer: ImageViewerComponent;
    @ViewChild(ActionMenuComponent) actionMenu: ActionMenuComponent;
    @ViewChild("xmlContainer") xmlContainerElementRef: ElementRef;
    @ViewChild("documentViewContainer")
    documentViewContainerElementRef: ElementRef;
    private _frameHolderElementRef: HTMLElement;
    @ViewChildren("frameHolder") set frameHolderElements(
        elements: QueryList<ElementRef>
    ) {
        this._frameHolderElementRef =
            elements.first && elements.first.nativeElement;
    }
    private visibleDocuments: DocumentInfo[];

    public data: {
        contactInfo: ContactInfoDto;
    };
    public formatting = AppConsts.formatting;
    public dataSource: DocumentInfo[];
    public previewContent: string = "";
    public actionMenuItems: ActionMenuItem[];
    public actionRecordData: any;
    public openDocumentMode = false;
    public currentDocumentInfo: DocumentInfo;
    public documentTypes: DocumentTypeInfo[];
    public wopiUrlsrc: string;
    public wopiAccessToken: string;
    public wopiAccessTokenTtl: string;
    public showViewerType: DocumentViewerType;
    public documentViewerTypes = DocumentViewerType;
    public clickedCellKey: string;
    public currentDocumentURL: string;
    private defaultNoDataText = this.ls("Platform", "NoData");
    public noDataText = "";
    public validTextExtensions: String[] = ["txt", "text"];
    public validXmlExtensions: String[] = ["xml"];
    public validCsvExtensions: String[] = ["csv"];
    public validWopiExtensions: String[] = [
        "doc",
        "docx",
        "xls",
        "xlsx",
        "ppt",
        "dot",
        "dotx",
        "docm",
        "odt",
        "pot",
        "potm",
        "pps",
        "ppsm",
        "pptm",
        "pptx",
        "ppsx",
        "odp",
        "xlsm",
        "xlsb",
        "ods",
    ];
    public validVideoExtensions: String[] = ["mp4", "3gp", "webm", "ogg"];
    public validArchiveExtensions: String[] = ["zip", "rar"];
    public validImageExtensions: String[] = [
        "jpeg",
        "jpg",
        "jfif",
        "jpe",
        "png",
        "pdf",
        "bmp",
        "gif",
    ];
    private allValidExtensions: String[] = [
        ...this.validWopiExtensions,
        ...this.validImageExtensions,
        ...this.validVideoExtensions,
        ...this.validArchiveExtensions,
        ...this.validCsvExtensions,
        ...this.validTextExtensions,
        ...this.validXmlExtensions,
    ];
    public viewerToolbarConfig: any = [];
    public parsedCsv: any;
    archiveFiles$: Observable<any[]>;
    manageAllowed = false;
    private readonly ident = "Documents";
    showPropertyDocuments: boolean =
        this._activatedRoute.snapshot.data.property;
    propertyId: number;
    private refresh: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
        false
    );
    refresh$: Observable<boolean> = this.refresh.asObservable();
    documents$: Observable<DocumentInfo[]> = combineLatest(
        this.showPropertyDocuments
            ? this.clientService.leadInfo$.pipe(
                  filter(Boolean),
                  map((leadInfo: LeadInfoDto) => leadInfo.propertyId),
                  tap((propertyId: number) => (this.propertyId = propertyId))
              )
            : this.clientService.contactInfo$.pipe(
                  filter(Boolean),
                  map((contactInfo: ContactInfoDto) => contactInfo.id)
              ),
        this.refresh$
    ).pipe(
        /** Save to cache and get from cache next time if it's not a hard refresh */
        switchMap(([id, hardRefresh]: [number, boolean]) => {
            return hardRefresh ||
                !this.documentProxy["data"] ||
                this.documentProxy["data"].contactId !== id
                ? this.documentProxy.getAll(id).pipe(
                      tap((documents: DocumentInfo[]) => {
                          this.documentProxy["data"] = {
                              contactId: id,
                              source: documents,
                          };
                          /** Clear hard refresh for next refreshes */
                          this.refresh.next(false);
                      })
                  )
                : of(this.documentProxy["data"].source);
        })
    );
    filteredDocuments$: Observable<DocumentInfo[]> = this.documents$;

    selectedDocumentTabsFilter: DocumentTabsFilter = DocumentTabsFilter.All;
    selectedViewType: string = DocumentViewTypeFilter.List;
    toolbarConfig: ToolbarGroupModel[];
    private _refresh: BehaviorSubject<null> = new BehaviorSubject<null>(null);
    private rootComponent: any;
    private selectedGroupByIndex = 0;
    private dataLayoutType: BehaviorSubject<DataLayoutType> = new BehaviorSubject(
        DataLayoutType.DataGrid
    );
    isGalleryView = false;

    constructor(
        injector: Injector,
        private dialog: MatDialog,
        private fileSizePipe: FileSizePipe,
        private documentProxy: DocumentServiceProxy,
        private documentTypeService: DocumentTypeServiceProxy,
        private contactService: ContactServiceProxy,
        private clientService: ContactsService,
        private printerService: PrinterService,
        private cacheService: CacheService,
        private renderer: Renderer2,
        private csvParser: Papa,
        public documentsService: DocumentsService,
        protected appService: AppService,
        private filtersService: FiltersService
    ) {
        super(injector);
        this.data = this.contactService["data"];
        clientService.invalidateSubscribe((area: string) => {
            if (area === "documents" || area === "property-documents") {
                this.documentProxy["data"] = undefined;
                this.refresh.next(true);
            }
        }, this.ident);
    }

    ngOnInit() {
        this.activate();
        this.loadDocumentTypes();
    }

    ngAfterViewInit() {
        this.clientService.contactInfo$
            .pipe(takeUntil(this.destroy$), filter(Boolean))
            .subscribe((contactInfo: ContactInfoDto) => {
                this.manageAllowed =
                    contactInfo &&
                    this.permission.checkCGPermission(contactInfo.groups);
                this.documents$
                    .pipe(takeUntil(this.destroy$), first())
                    .subscribe((documents: DocumentInfo[]) => {
                        if (
                            this.manageAllowed &&
                            (!documents || !documents.length)
                        )
                            setTimeout(() => this.openDocumentAddDialog());
                    });
                this.initActionMenuItems();
            });
    }

    private initActionMenuItems() {
        this.actionMenuItems = [
            {
                text: this.l("Edit"),
                class: "edit",
                action: this.editDocument.bind(this),
                disabled: !this.manageAllowed,
            },
            {
                text: this.l("Download"),
                class: "download",
                action: this.downloadDocumentFromActionsMenu.bind(this),
            },
            {
                text: this.l("Delete"),
                class: "delete",
                action: this.deleteDocument.bind(this),
                disabled: !this.manageAllowed,
            },
        ];
    }

    private storeWopiRequestInfoToCache(
        wopiDocumentDataCacheKey: string,
        requestInfo: WopiRequestOutcoming
    ) {
        this.cacheService.set(wopiDocumentDataCacheKey, requestInfo, {
            maxAge:
                requestInfo.validityPeriodSeconds -
                this.documentsService.RESERVED_TIME_SECONDS,
        });
    }

    private getViewWopiRequestInfoObservable(): Observable<WopiRequestOutcoming> {
        let wopiDocumentDataCacheKey = "_Wopi_" + this.currentDocumentInfo.id;
        if (this.cacheService.exists(wopiDocumentDataCacheKey)) {
            let requestInfo = this.cacheService.get(
                wopiDocumentDataCacheKey
            ) as WopiRequestOutcoming;
            return of(requestInfo);
        }

        return this.documentProxy
            .getViewWopiRequestInfo(this.currentDocumentInfo.id)
            .pipe(
                flatMap((response) => {
                    this.storeWopiRequestInfoToCache(
                        wopiDocumentDataCacheKey,
                        response
                    );
                    return of(response);
                })
            );
    }

    initViewerToolbar(conf: any = {}) {
        this.viewerToolbarConfig = [
            {
                location: "before",
                items: [
                    {
                        name: "back",
                        action: this.closeDocument.bind(this),
                    },
                    {
                        html: `<div class="file-name ${this.getFileExtensionByFileName(
                            this.currentDocumentInfo.fileName
                        )} ${this.getFileType(
                            this.currentDocumentInfo.fileName
                        )}" title="${
                            this.currentDocumentInfo.fileName
                        } ${this.fileSizePipe.transform(
                            this.currentDocumentInfo.size
                        )}">
                                    ${this.currentDocumentInfo.fileName
                                        .split(".")
                                        .shift()}
                               </div>`,
                    },
                ],
            },
            {
                location: "after",
                items: [
                    {
                        name: "edit",
                        action: this.editDocument.bind(this),
                        disabled: conf.editDisabled,
                    },
                    {
                        name: "delete",
                        action: this.deleteDocument.bind(this),
                        visible: this.manageAllowed,
                    },
                ],
            },
            {
                location: "after",
                items: [
                    {
                        name: "download",
                        action: this.downloadDocument.bind(this),
                    },
                    {
                        name: "print",
                        visible: false /*!conf.printHidden*/,
                        action: () => {
                            const viewedDocument = <any>(
                                this.getViewedDocumentElement()
                            );
                            if (
                                this.showViewerType !==
                                    DocumentViewerType.WOPI &&
                                this.showViewerType !== DocumentViewerType.VIDEO
                            ) {
                                const printSrc =
                                    this.showViewerType ==
                                    DocumentViewerType.IMAGE
                                        ? this.imageViewer.images[0]
                                        : viewedDocument.textContent;
                                const format = <any>(
                                    this.getFileExtensionByFileName(
                                        this.currentDocumentInfo.fileName
                                    )
                                );
                                this.printerService.printDocument(
                                    printSrc,
                                    format
                                );
                            }
                        },
                    },
                ],
            },
            {
                location: "after",
                items: [
                    {
                        name: "rotateLeft",
                        action: this.rotateImageLeft.bind(this),
                        visible: conf.viewerType == DocumentViewerType.IMAGE,
                        disabled: conf.rotateDisabled,
                    },
                    {
                        name: "rotateRight",
                        action: this.rotateImageRight.bind(this),
                        visible: conf.viewerType == DocumentViewerType.IMAGE,
                        disabled: conf.rotateDisabled,
                    },
                ],
            },
            {
                location: "after",
                items: [
                    {
                        name: "prev",
                        action: (e) => {
                            this.viewDocument.call(
                                this,
                                DocumentType.Prev,
                                e.event.originalEvent
                            );
                        },
                        disabled: conf.prevButtonDisabled,
                    },
                    {
                        name: "next",
                        action: (e) => {
                            this.viewDocument.call(
                                this,
                                DocumentType.Next,
                                e.event.originalEvent
                            );
                        },
                        disabled: conf.nextButtonDisabled,
                    },
                ],
            },
            {
                location: "after",
                items: [
                    {
                        name: "fullscreen",
                        action: () => {
                            const fullScreenTarget =
                                this.getViewedDocumentElement();
                            this.fullScreenService.toggleFullscreen(
                                fullScreenTarget
                            );
                        },
                    },
                ],
            },
            {
                location: "after",
                items: [
                    {
                        name: "close",
                        action: this.closeDocument.bind(this),
                    },
                ],
            },
        ];
        this.clientService.toolbarUpdate({
            customToolbar: this.viewerToolbarConfig,
        });
    }

    getViewedDocumentElement() {
        const viewedDocumentSelector = ".documentView";
        let viewedDocumentElement = document.querySelector(
            viewedDocumentSelector
        );
        /** If selector contains iframe - use it at fullScreen */
        const iframe = viewedDocumentElement.querySelector("iframe");
        if (iframe) {
            viewedDocumentElement = iframe;
        }
        return viewedDocumentElement;
    }

    refreshDataGrid() {
        this.dataGrid.instance.refresh();
    }

    loadDocumentTypes() {
        if (!(this.documentTypes = this.documentTypeService["data"]))
            this.documentTypeService
                .getAll()
                .subscribe((documentTypes: DocumentTypeInfo[]) => {
                    this.documentTypeService["data"] = this.documentTypes =
                        documentTypes;
                });
    }

    startLoading(element = null) {
        super.startLoading(false, element || this.dataGrid.instance.element());
    }

    finishLoading() {
        setTimeout(() => (this.noDataText = this.defaultNoDataText));
        super.finishLoading(false, this.dataGrid.instance.element());
    }

    downloadDocument() {
        this.documentsService.downloadDocument(this.currentDocumentInfo.id);
    }

    openDocumentAddDialog() {
        if (!this.dialog.getDialogById("template-documents-dialog")) {
            this.clientService.showUploadDocumentsDialog(
                this.contactId,
                this.showPropertyDocuments
                    ? this.l("UploadPropertyDocumentsDialogTitle")
                    : null
            );
        }
    }

    onToolbarPreparing($event) {
        $event.toolbarOptions.items.push({
            location: "before",
            template: "title",
        });
    }

    calculateFileSizeValue = (data: DocumentInfo) =>
        this.fileSizePipe.transform(data.size);

    numerizeFileSizeSortValue = (rowData) => +rowData.size;

    onContentReady() {
        this.setGridDataLoaded();
    }

    toggleActionsMenu(data, target) {
        this.actionRecordData = data;
        this.actionMenuItems.find(
            (menuItem) => menuItem.text === this.l("Edit")
        ).visible = data.isEditSupportedByWopi;
        this.actionMenu.toggle(target);
    }

    onCellClick($event) {
        this.clickedCellKey = undefined;
        const target = $event.event.target;
        if ($event.rowType === "data") {
            /** If user click on actions icon */
            if (target.closest(".dx-link.dx-link-edit")) {
                this.toggleActionsMenu($event.data, target);
            } else if (target.closest(".document-type")) {
                /** If user click on document type */
                this.clickedCellKey = $event.data.id;
            } else {
                this.currentDocumentInfo = $event.data;
                /** Save sorted visible rows to get next and prev properly */
                this.visibleDocuments = $event.component
                    .getVisibleRows()
                    .map((row) => row.data);
                /** If user click the whole row */
                this.viewDocument(DocumentType.Current, $event.event);
            }
        }
    }

    onMenuItemClick($event) {
        this.currentDocumentInfo = this.actionRecordData;
        $event.itemData.action.call(this);
        this.actionRecordData = null;
        this.actionMenu.hide();
    }

    getFileType(fileName): string {
        const fileExtension = this.getFileExtensionByFileName(fileName);
        return this.getViewerType(fileExtension);
    }

    get contactId(): number {
        return this.showPropertyDocuments
            ? this.propertyId
            : this.data.contactInfo.id;
    }

    private getFileExtensionByFileName(fileName: string): string {
        return fileName && fileName.split(".").pop();
    }

    private getFileNameWithoutExtension(fileName: string): string {
        if (!fileName) return '';
        return fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
    }

    viewDocument(type: DocumentType = DocumentType.Current, event?: Event) {
        let currentDocumentIndex = this.visibleDocuments.indexOf(
            this.currentDocumentInfo
        );
        if (type !== DocumentType.Current) {
            currentDocumentIndex = currentDocumentIndex + type;
            const prevOrNextDocument =
                this.visibleDocuments[currentDocumentIndex];
            /** If there is no next or prev document - just don't do any action */
            if (!prevOrNextDocument) {
                return;
            }
            this.currentDocumentInfo = prevOrNextDocument;
        }

        const ext = this.getFileExtensionByFileName(
            this.currentDocumentInfo.fileName
        );
        const viewerType = this.getViewerType(ext);
        this.showViewerType = undefined;
        if (viewerType !== DocumentViewerType.UNKNOWN) {
            if (viewerType != DocumentViewerType.WOPI) {
                super.startLoading(true);
                this.initViewerToolbar({
                    viewerType: viewerType,
                    rotateDisabled: ext == "pdf",
                    editDisabled:
                        !this.currentDocumentInfo.isEditSupportedByWopi,
                    prevButtonDisabled: currentDocumentIndex === 0, // document is first in list
                    nextButtonDisabled:
                        currentDocumentIndex ===
                        this.visibleDocuments.length - 1, // document is last in list
                    printHidden:
                        viewerType === DocumentViewerType.IMAGE ||
                        viewerType === DocumentViewerType.VIDEO ||
                        ext === "pdf",
                });
            }
            switch (viewerType) {
                case DocumentViewerType.WOPI:
                    this.message.confirm(
                        "",
                        this.l("Do you want to download this file?"),
                        (isConfirmed) => {
                            this.openDocumentMode = false;
                            if (isConfirmed) this.downloadDocument();
                        }
                    );
                    /*                  
    !!VP Currently Wopi API does not work
    this.getViewWopiRequestInfoObservable().pipe(finalize(() => {
        super.finishLoading(true);
    })).subscribe((response) => {
        this.showOfficeOnline(response);
    });
*/
                    break;
                case DocumentViewerType.VIDEO:
                    this.documentsService
                        .getDocumentUrlInfoObservable(
                            this.currentDocumentInfo.id
                        )
                        .subscribe((urlInfo) => {
                            super.finishLoading(true);
                            this.currentDocumentURL = urlInfo.url;
                            this.showViewerType = viewerType;
                            this.openDocumentMode = true;
                        });
                    break;
                default:
                    this.documentsService
                        .getDocumentUrlInfoObservable(
                            this.currentDocumentInfo.id
                        )
                        .subscribe((urlInfo) => {
                            RequestHelper.downloadFileBlob(
                                urlInfo.url,
                                (blob) => {
                                    if (
                                        viewerType ===
                                        DocumentViewerType.ARCHIVE
                                    ) {
                                        this.archiveFiles$ = (
                                            ext === "rar"
                                                ? this.getFilesInfoFromRarBlob(
                                                      blob
                                                  )
                                                : this.getFilesInfoFromZipBlob(
                                                      blob
                                                  )
                                        ).pipe(
                                            tap(
                                                () =>
                                                    (this.openDocumentMode =
                                                        true)
                                            )
                                        );
                                    } else {
                                        let reader = new FileReader();
                                        reader.addEventListener(
                                            "loadend",
                                            () => {
                                                this.openDocumentMode = true;
                                                let content =
                                                    StringHelper.getBase64(
                                                        reader.result as string
                                                    );
                                                this.previewContent =
                                                    viewerType ===
                                                        DocumentViewerType.TEXT ||
                                                    viewerType ===
                                                        DocumentViewerType.XML ||
                                                    viewerType ===
                                                        DocumentViewerType.CSV
                                                        ? atob(content)
                                                        : content;
                                                if (
                                                    viewerType ===
                                                    DocumentViewerType.XML
                                                ) {
                                                    const json = xmlJs.xml2js(
                                                        this.sanitizeContent(
                                                            this.previewContent
                                                        ),
                                                        {
                                                            compact: true,
                                                            trim: true,
                                                            ignoreDoctype: true,
                                                            ignoreDeclaration:
                                                                true,
                                                            ignoreAttributes:
                                                                true,
                                                        }
                                                    );
                                                    this.xmlContainerElementRef.nativeElement.innerHTML =
                                                        "";
                                                    this.renderer.appendChild(
                                                        this
                                                            .xmlContainerElementRef
                                                            .nativeElement,
                                                        new JSONFormatter(
                                                            json,
                                                            2
                                                        ).render()
                                                    );
                                                }
                                                if (
                                                    viewerType ===
                                                    DocumentViewerType.CSV
                                                ) {
                                                    this.csvParser.parse(
                                                        this.previewContent,
                                                        {
                                                            complete: (
                                                                result: PapaParseResult
                                                            ) => {
                                                                if (
                                                                    !result.errors ||
                                                                    !result
                                                                        .errors
                                                                        .length
                                                                ) {
                                                                    this.parsedCsv =
                                                                        result.data;
                                                                }
                                                            },
                                                        }
                                                    );
                                                }
                                            }
                                        );
                                        reader.readAsDataURL(blob);
                                    }
                                    this.showViewerType = viewerType;
                                    super.finishLoading(true);
                                },
                                false,
                                (event) => {
                                    super.finishLoading(true);
                                    if (event.status == 404)
                                        this.message.error(
                                            this.ls(
                                                "Platform",
                                                "FileIsNotAccessible"
                                            )
                                        );
                                    else this.message.error(event.statusText);
                                }
                            );
                        });
                    break;
            }
        } else {
            /** If not supported file was opend through navigation - then update toolbar */
            if (type !== DocumentType.Current) {
                this.initViewerToolbar({
                    viewerType: null,
                    rotateDisabled: true,
                    editDisabled: true,
                    prevButtonDisabled: currentDocumentIndex === 0, // document is first in list
                    nextButtonDisabled:
                        currentDocumentIndex ===
                        this.visibleDocuments.length - 1, // document is last in list
                    printHidden: true,
                });
            }
            this.dialog.open(NotSupportedTypeDialogComponent, {
                data: {
                    documentId: this.currentDocumentInfo.id,
                },
            });
            if (event && event.preventDefault) {
                event.preventDefault();
                event.stopPropagation();
            }
        }
    }

    getViewerType(extension: string): DocumentViewerType {
        let lowerExtension = extension ? extension.toLowerCase() : extension;
        let viewerType = DocumentViewerType.UNKNOWN;
        if (this.validWopiExtensions.indexOf(lowerExtension) >= 0) {
            viewerType = DocumentViewerType.WOPI;
        } else if (this.validCsvExtensions.indexOf(lowerExtension) >= 0) {
            viewerType = DocumentViewerType.CSV;
        } else if (this.validImageExtensions.indexOf(lowerExtension) >= 0) {
            viewerType = DocumentViewerType.IMAGE;
        } else if (this.validTextExtensions.indexOf(lowerExtension) >= 0) {
            viewerType = DocumentViewerType.TEXT;
        } else if (this.validVideoExtensions.indexOf(lowerExtension) >= 0) {
            viewerType = DocumentViewerType.VIDEO;
        } else if (this.validArchiveExtensions.indexOf(lowerExtension) >= 0) {
            viewerType = DocumentViewerType.ARCHIVE;
        } else if (this.validXmlExtensions.indexOf(lowerExtension) >= 0) {
            viewerType = DocumentViewerType.XML;
        }
        return viewerType;
    }

    private getFilesInfoFromRarBlob(blob: Blob) {
        return from(Rar.fromFile(blob)).pipe(
            pluck("entries"),
            map((archives: Rar.RarEntry[]) =>
                archives.map((archive: Rar.RarEntry) => ({
                    name: archive.name,
                    date: archive.time,
                }))
            )
        );
    }

    private getFilesInfoFromZipBlob(blob: Blob) {
        return from(new jszip().loadAsync(blob)).pipe(
            pluck("files"),
            map((files) => values(files))
        );
    }

    sanitizeContent(content: string): string {
        return content.replace(/&/g, "&amp;");
    }

    editDocument() {
        this.initViewerToolbar({
            editDisabled: true,
        });
        super.startLoading(true);
        this.documentProxy
            .getEditWopiRequestInfo(this.currentDocumentInfo.id)
            .pipe(
                finalize(() => {
                    super.finishLoading(true);
                })
            )
            .subscribe((response) => {
                this.showOfficeOnline(response);
            });
    }

    showOfficeOnline(wopiRequestInfo: WopiRequestOutcoming) {
        this.showViewerType = DocumentViewerType.WOPI;
        this.wopiUrlsrc = wopiRequestInfo.wopiUrlsrc;
        this.wopiAccessToken = wopiRequestInfo.accessToken;
        this.wopiAccessTokenTtl = wopiRequestInfo.accessTokenTtl.toString();
        setTimeout(() => {
            this._frameHolderElementRef.innerHTML = "";
            this.openDocumentMode = true;
        });
        setTimeout(() => this.submitWopiRequest(), 500);
    }

    submitWopiRequest() {
        let office_frame = document.createElement("iframe");
        office_frame.name = "office_frame";
        office_frame.id = "office_frame";
        office_frame.title = "Office Online Frame";
        office_frame.setAttribute("allowfullscreen", "true");
        office_frame.setAttribute("frameBorder", "0");
        office_frame.onload = (event) => {
            let eventTarget = <HTMLFormElement>event.target;
            const documentViewContainerRect =
                this.documentViewContainerElementRef.nativeElement.getBoundingClientRect();
            eventTarget.width =
                window.innerWidth - documentViewContainerRect.left;
            eventTarget.height =
                window.innerHeight - documentViewContainerRect.top - 1;
        };
        this._frameHolderElementRef.appendChild(office_frame);
        let officeForm = <HTMLFormElement>(
            document.getElementById("office_form")
        );
        officeForm.submit();
    }

    deleteDocument() {
        this.message.confirm(
            this.l(
                "DocumentDeleteWarningMessage",
                this.currentDocumentInfo.fileName
            ),
            "",
            (isConfirmed) => {
                if (isConfirmed) {
                    super.startLoading(true);
                    this.showViewerType = undefined;
                    this.openDocumentMode = false;
                    this.documentProxy
                        .delete(this.currentDocumentInfo.id)
                        .pipe(finalize(() => super.finishLoading(true)))
                        .subscribe(() => {
                            this.refresh.next(true);
                            this.documents$.pipe(first()).subscribe(() => {
                                if (
                                    this.actionMenu &&
                                    this.actionMenu.visible
                                ) {
                                    this.hideActionsMenu();
                                }
                                this.closeDocument();
                            });
                        });
                }
            }
        );
    }

    downloadDocumentFromActionsMenu() {
        this.downloadDocument();
        this.hideActionsMenu();
    }

    rotateImageRight() {
        this.imageViewer.rotacionarDireita();
    }

    rotateImageLeft() {
        this.imageViewer.rotacionarEsquerda();
    }

    closeDocument() {
        this.openDocumentMode = false;
        this.clientService.toolbarUpdate();
    }

    @HostListener("document:keydown", ["$event"])
    handleKeyDown(event: KeyboardEvent) {
        if (this.openDocumentMode) {
            /** Arrow left is pressed */
            if (event.keyCode === 37) {
                this.viewDocument(DocumentType.Prev, event);
            }
            /** Arrow right is pressed */
            if (event.keyCode === 39) {
                this.viewDocument(DocumentType.Next, event);
            }
        }
    }

    onDocumentTypeSelected(documentTypeId, data) {
        setTimeout(() => {
            this.documentProxy
                .updateType(
                    UpdateTypeInput.fromJS({
                        documentId: data.id,
                        typeId: documentTypeId,
                    })
                )
                .subscribe(() => {
                    this.clickedCellKey = undefined;
                    data.typeId = documentTypeId;
                    data.typeName = documentTypeId
                        ? this.documentTypes.find(
                              (item) => item.id == documentTypeId
                          ).name
                        : undefined;
                });
        }, 300);
    }

    hideActionsMenu() {
        this.actionMenu.hide();
    }

    onTypeListUpdated(list) {
        this.documentTypeService["data"] = this.documentTypes = list;
    }

    sortCreationDateTime(prev, next) {
        return moment(prev).diff(moment(next)) >= 0 ? 1 : -1;
    }

    triggerToolbarFilter() {
        this.initToolbarConfig();
    }

    filterDocumentsByType = (filterValue) => {
        if (filterValue === 'all') {
            this.filteredDocuments$ = this.documents$;
            return;
        }

        let allowedExts = [];

        switch (filterValue) {
            case 'All':
                allowedExts = [
                    ...this.validWopiExtensions,
                    ...this.validImageExtensions,
                    ...this.validVideoExtensions,
                    ...this.validArchiveExtensions,
                    ...this.validCsvExtensions,
                    ...this.validTextExtensions,
                    ...this.validXmlExtensions,
                ];
            break;
            case 'Images':
                allowedExts = this.validImageExtensions;
            break;
            case 'Videos':
                allowedExts = this.validVideoExtensions;
            break;
            case 'PDFs':
                allowedExts = ['pdf'];
            break;
            case 'Text':
                allowedExts = this.validTextExtensions;
            break;
            case 'CSV':
                allowedExts = this.validCsvExtensions;
            break;
            case 'XML':
                allowedExts = this.validXmlExtensions;
            break;
            case 'ARCHIVE':
                allowedExts = this.validArchiveExtensions;
            break;
            case 'Invoices':
                allowedExts = ['pdf'];
            break;
        }

        this.filteredDocuments$ = this.documents$.pipe(
            map((documents) =>
                documents.filter((document) =>
                    allowedExts.includes(this.getFileExtensionByFileName(document.fileName))
                )
            )
        );
    };

    initToolbarConfig() {
        this.toolbarConfig = [
            {
                location: "before",
                locateInMenu: "auto",
                areItemsDependent: true,
                items: Object.keys(DocumentTabsFilter).map((key) => {
                    return {
                        name: key,
                        widget: "dxButton",
                        options: {
                            text: key,
                            checkPressed: () => {
                                return (
                                    this.selectedDocumentTabsFilter == DocumentTabsFilter[key]
                                );
                            },
                        },
                        action: () => {
                            this.selectedDocumentTabsFilter = DocumentTabsFilter[key];
                            this.filterDocumentsByType(DocumentTabsFilter[key]);
                            this.triggerToolbarFilter();
                        },
                        attr: {
                            "class": `document-filter-type ${this.selectedDocumentTabsFilter == DocumentTabsFilter[key] ? "document-selected" : ""}`,
                        },
                    };
                }),
            },
            {
                location: 'before',
                locateInMenu: 'auto',
                items: [
                    {
                        name: 'select-box',
                        text: this.l('By Ext'),
                        widget: 'dxDropDownMenu',
                        options: {
                            hint: this.l('Filter By Extension'),
                            selectedIndex: this.selectedGroupByIndex,
                            items: [
                                '',
                                ...this.allValidExtensions
                            ].map((extension) => {
                                return {
                                    action: this.filterByExtension.bind(this),
                                    text: extension
                                }
                            }),
                            onSelectionChanged: (e) => {
                                if (e) {
                                    this.selectedGroupByIndex = e.itemIndex;
                                }
                            }
                        }
                    }
                ]
            },
            {
                location: "after",
                items: [
                    {
                        name: "search",
                        widget: "dxTextBox",
                        options: {
                            value: this.searchValue,
                            width: "263",
                            mode: "search",
                            placeholder:
                                this.l("Search") +
                                " " +
                                this.l("files and documents").toLowerCase(),
                            onValueChanged: (e) => {
                                this.searchValueChange(e);
                            },
                        },
                        attr: {
                            "class": "document-search-filter"
                        }
                    }
                ],
            },
            {
                location: 'after',
                locateInMenu: 'auto',
                areItemsDependent: true,
                items: [
                    {
                        name: 'gallery',
                        action: () => {
                            this.selectedViewType = DocumentViewTypeFilter.Grid;
                            this.triggerToolbarFilter();
                            this.isGalleryView = true;
                        },
                        options: {
                            checkPressed: () => this.showGallery
                        },
                        attr: {
                            "class": `dx-document-grid-view ${this.selectedViewType === DocumentViewTypeFilter.Grid ? 'dx-document-selected-view' : ''}`
                        }
                    },
                    {
                        name: 'list',
                        action: ()  => {
                            this.selectedViewType = DocumentViewTypeFilter.List;
                            this.triggerToolbarFilter();
                            this.isGalleryView = false;
                        },
                        options: {
                            checkPressed: () => this.showDataGrid
                        },
                        attr: {
                            "class": `dx-document-list-view ${this.selectedViewType === DocumentViewTypeFilter.List ? 'dx-document-selected-view' : ''}`
                        }
                    },
                ]
            }
        ];
    }

    searchValueChange(e: object) {
        if (this.searchValue != e['value']) {
            this.searchValue = e['value'];
            this.invalidate();
        }
    }

    invalidate() {
        this._refresh.next(null);
    }

    activate() {
        super.activate();
        this.searchClear = false;
        this.initToolbarConfig();
        this.rootComponent = this.getRootComponent();
        this.rootComponent.overflowHidden(true);

        this.showHostElement();
    }

    filterByExtension(event) {
        const selectedExtension = event.itemData.text;

        if(!selectedExtension || !this.allValidExtensions.includes(selectedExtension)) {
            this.filteredDocuments$ = this.documents$;
            return;
        };

        this.filteredDocuments$ = this.documents$.pipe(
            map((documents) =>
                documents.filter((document) => {
                    console.log(document, this.getFileExtensionByFileName(document.fileName), selectedExtension);
                    return this.getFileExtensionByFileName(document.fileName) == selectedExtension;
                })
            )
        );
    }

    get showDataGrid(): boolean {
        return this.dataLayoutType.value === DataLayoutType.DataGrid && !this.isGalleryView;
    }

    get showGallery(): boolean {
        return this.dataLayoutType.value === DataLayoutType.DataGrid && this.isGalleryView;
    }

    ngOnDestroy() {
        this.deactivate();
        this.clientService.unsubscribe(this.ident);
        this.closeDocument();
        super.ngOnDestroy();
    }
}
