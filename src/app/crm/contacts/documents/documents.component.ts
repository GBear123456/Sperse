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
    QueryList
} from '@angular/core';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { DxTooltipComponent } from 'devextreme-angular/ui/tooltip';
import 'devextreme/data/odata/store';
import { ImageViewerComponent } from 'ng2-image-viewer';
import { Observable, from, of } from 'rxjs';
import { finalize, flatMap, tap, pluck, map } from 'rxjs/operators';
import { CacheService } from 'ng2-cache-service';
import * as xmlJs from 'xml-js';
import { values } from 'lodash';
import JSONFormatter from 'json-formatter-js';
import '@node_modules/ng2-image-viewer/imageviewer.js';
import * as jszip from 'jszip';
import * as Rar from 'rarjs/rar.js';
import { Papa } from 'ngx-papaparse';
import { PapaParseResult } from 'ngx-papaparse/lib/interfaces/papa-parse-result';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { AppComponentBase } from '@shared/common/app-component-base';
import { ContactServiceProxy, ContactInfoDto, DocumentServiceProxy,
DocumentInfo, DocumentTypeServiceProxy, DocumentTypeInfo, UpdateTypeInput, WopiRequestOutcoming } from '@shared/service-proxies/service-proxies';
import { FileSizePipe } from '@shared/common/pipes/file-size.pipe';
import { PrinterService } from '@shared/common/printer/printer.service';
import { StringHelper } from '@shared/helpers/StringHelper';
import { DocumentType } from './document-type.enum';
import { ContactsService } from '../contacts.service';
import { UploadDocumentsDialogComponent } from '@app/crm/contacts/documents/upload-documents-dialog/upload-documents-dialog.component';
import { NotSupportedTypeDialogComponent } from '@app/crm/contacts/documents/not-supported-type-dialog/not-supported-type-dialog.component';
import { DocumentsService } from '@app/crm/contacts/documents/documents.service';
import { DocumentViewerType } from '@app/crm/contacts/documents/document-viewer-type.enum';

@Component({
    templateUrl: './documents.component.html',
    styleUrls: ['./documents.component.less'],
    providers: [ FileSizePipe, PrinterService ]
})
export class DocumentsComponent extends AppComponentBase implements AfterViewInit, OnInit, OnDestroy {
    @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;
    @ViewChild(ImageViewerComponent) imageViewer: ImageViewerComponent;
    @ViewChild(DxTooltipComponent) actionsTooltip: DxTooltipComponent;
    @ViewChild('xmlContainer') xmlContainerElementRef: ElementRef;
    @ViewChild('documentViewContainer') documentViewContainerElementRef: ElementRef;
    private _frameHolderElementRef: HTMLElement;
    @ViewChildren('frameHolder') set frameHolderElements(elements: QueryList<ElementRef>) {
        this._frameHolderElementRef = elements.first && elements.first.nativeElement;
    }
    private visibleDocuments: DocumentInfo[];

    public data: {
        contactInfo: ContactInfoDto
    };
    public formatting = AppConsts.formatting;
    public dataSource: DocumentInfo[];
    public previewContent: string;
    public actionMenuItems: any;
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
    private defaultNoDataText = this.ls('Platform', 'NoData');
    public noDataText = '';
    public validTextExtensions: String[] = ['txt', 'text'];
    public validXmlExtensions: String[] = ['xml'];
    public validCsvExtensions: String[] = ['csv'];
    public validWopiExtensions: String[] = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'dot', 'dotx', 'docm', 'odt', 'pot', 'potm', 'pps', 'ppsm', 'pptm', 'pptx', 'ppsx', 'odp', 'xlsm', 'xlsb', 'ods'];
    public validVideoExtensions: String[] = ['mp4', 'mov'];
    public validArchiveExtensions: String[] = ['zip', 'rar'];
    public validImageExtensions: String[] = ['jpeg', 'jpg', 'png', 'pdf', 'bmp', 'gif'];
    public viewerToolbarConfig: any = [];
    public parsedCsv: any;
    archiveFiles$: Observable<{ name: string, data: Date }[]>;

    constructor(injector: Injector,
        private dialog: MatDialog,
        private _fileSizePipe: FileSizePipe,
        private _documentService: DocumentServiceProxy,
        private _documentTypeService: DocumentTypeServiceProxy,
        private _contactService: ContactServiceProxy,
        private _clientService: ContactsService,
        private printerService: PrinterService,
        private cacheService: CacheService,
        private renderer: Renderer2,
        public documentsService: DocumentsService,
        private csvParser: Papa
    ) {
        super(injector);
        this.localizationSourceName = AppConsts.localization.CRMLocalizationSourceName;
        this.actionMenuItems = [
            {
                text: this.l('Edit'),
                action: this.editDocument.bind(this)
            },
            {
                text: this.l('Download'),
                action: this.downloadDocumentFromActionsMenu.bind(this)
            },
            {
                text: this.l('Delete'),
                action: this.deleteDocument.bind(this)
            }
        ];
        this.data = this._contactService['data'];
        _clientService.invalidateSubscribe((area) => {
            if (area == 'documents') {
                this._documentService['data'] = undefined;
                this.loadDocuments();
            }
        });
    }

    private storeWopiRequestInfoToCache(wopiDocumentDataCacheKey: string, requestInfo: WopiRequestOutcoming) {
        this.cacheService.set(wopiDocumentDataCacheKey, requestInfo,
            { maxAge: requestInfo.validityPeriodSeconds - this.documentsService.RESERVED_TIME_SECONDS });
    }

    private getViewWopiRequestInfoObservable(): Observable<WopiRequestOutcoming> {
        let wopiDocumentDataCacheKey = '_Wopi_' + this.currentDocumentInfo.id;
        if (this.cacheService.exists(wopiDocumentDataCacheKey)) {
            let requestInfo = this.cacheService.get(wopiDocumentDataCacheKey) as WopiRequestOutcoming;
            return of(requestInfo);
        }

        return this._documentService.getViewWopiRequestInfo(this.currentDocumentInfo.id).pipe(
            flatMap((response) => {
                this.storeWopiRequestInfoToCache(wopiDocumentDataCacheKey, response);
                return of(response);
            }));
    }

    initViewerToolbar(conf: any = {}) {
        this.viewerToolbarConfig = [
            {
                location: 'before', items: [
                    {
                        name: 'back',
                        action: this.closeDocument.bind(this)
                    },
                    {
                        html: `<div class="file-name ${this.getFileExtensionByFileName(this.currentDocumentInfo.fileName)} ${this.getFileType(this.currentDocumentInfo.fileName)}" title="${this.currentDocumentInfo.fileName} ${this._fileSizePipe.transform(this.currentDocumentInfo.size)}">
                                    ${this.currentDocumentInfo.fileName.split('.').shift()}
                               </div>`
                    }
                ]
            },
            {
                location: 'after', items: [
                    {
                        name: 'edit',
                        action: this.editDocument.bind(this),
                        disabled: conf.editDisabled
                    },
                    {
                        name: 'delete',
                        action: this.deleteDocument.bind(this)
                    }
                ]
            },
            {
                location: 'after', items: [
                    {
                        name: 'download',
                        action: this.downloadDocument.bind(this)
                    },
                    {
                        name: 'print',
                        visible: !conf.printHidden,
                        action: () => {
                            const viewedDocument = <any>this.getViewedDocumentElement();
                            if (this.showViewerType !== DocumentViewerType.WOPI && this.showViewerType !== DocumentViewerType.VIDEO) {
                                const printSrc = this.showViewerType == DocumentViewerType.IMAGE ?
                                    this.imageViewer.images[0] :
                                    viewedDocument.textContent;
                                const format = <any>this.getFileExtensionByFileName(this.currentDocumentInfo.fileName);
                                this.printerService.printDocument(printSrc, format);
                            }
                        }
                    }
                ]
            },
            {
                location: 'after', items: [
                    {
                        name: 'rotateLeft',
                        action: this.rotateImageLeft.bind(this),
                        visible: conf.viewerType == DocumentViewerType.IMAGE,
                        disabled: conf.rotateDisabled
                    },
                    {
                        name: 'rotateRight',
                        action: this.rotateImageRight.bind(this),
                        visible: conf.viewerType == DocumentViewerType.IMAGE,
                        disabled: conf.rotateDisabled
                    }
                ]
            },
            {
                location: 'after', items: [
                    {
                        name: 'prev',
                        action: e => {
                            this.viewDocument.call(this, DocumentType.Prev, e.event.originalEvent);
                        },
                        disabled: conf.prevButtonDisabled
                    },
                    {
                        name: 'next',
                        action: e => {
                            this.viewDocument.call(this, DocumentType.Next, e.event.originalEvent);
                        },
                        disabled: conf.nextButtonDisabled
                    }
                ]
            },
            {
                location: 'after', items: [
                    {
                        name: 'fullscreen',
                        action: () => {
                            const fullScreenTarget = this.getViewedDocumentElement();
                            this.toggleFullscreen(fullScreenTarget);
                        }
                    }
                ]
            },
            {
                location: 'after', items: [
                    {
                        name: 'close',
                        action: this.closeDocument.bind(this)
                    }
                ]
            }
        ];
        this._clientService.toolbarUpdate(this.viewerToolbarConfig);
    }

    getViewedDocumentElement() {
        const viewedDocumentSelector = '.documentView';
        let viewedDocumentElement = document.querySelector(viewedDocumentSelector);
        /** If selector contains iframe - use it at fullScreen */
        const iframe = viewedDocumentElement.querySelector('iframe');
        if (iframe) {
            viewedDocumentElement = iframe;
        }
        return viewedDocumentElement;
    }

    refreshDataGrid() {
        this.dataGrid.instance.refresh();
    }

    ngOnInit() {
        this.loadDocumentTypes();
    }

    ngAfterViewInit() {
        this.loadDocuments();
    }

    loadDocumentTypes() {
        if (!(this.documentTypes = this._documentTypeService['data']))
            this._documentTypeService.getAll().subscribe((result) => {
                this._documentTypeService['data'] = this.documentTypes = result;
            });
    }

    onDataGridInit(e) {
        this.startLoading(e.component.element());
    }

    startLoading(element = null) {
        super.startLoading(false, element || this.dataGrid.instance.element());
    }

    finishLoading() {
        setTimeout(() => this.noDataText = this.defaultNoDataText);
        super.finishLoading(false, this.dataGrid.instance.element());
    }

    loadDocuments(callback = null) {
        this.startLoading();
        let documentData = this._documentService['data'], groupId = this.data.contactInfo.id;
        const dataSource$: Observable<DocumentInfo[]> = !callback && documentData && documentData.groupId == groupId
                            ? of(documentData.source)
                            : this._documentService.getAll(groupId).pipe(tap((documents: DocumentInfo[]) => {
                                this._documentService['data'] = {
                                    groupId: groupId,
                                    source: documents
                                };
                            }));
        dataSource$.pipe(finalize(() => this.finishLoading())).subscribe((documents: DocumentInfo[]) => {
            if (this.componentIsActivated) {
                this.dataSource = documents;
                if (!this.dataSource || !this.dataSource.length)
                    setTimeout(() => this.openDocumentAddAddDialog());
                callback && callback();
            } 
        });
    }

    downloadDocument() {
        this.documentsService.downloadDocument(this.currentDocumentInfo.id);
    }

    openDocumentAddAddDialog() {
        this.dialog.open(UploadDocumentsDialogComponent, {
            panelClass: 'slider',
            disableClose: false,
            hasBackdrop: false,
            closeOnNavigation: true,
            data: {
                contactId: this.data.contactInfo.id
            }
        });
    }

    onToolbarPreparing($event) {
        $event.toolbarOptions.items.push({
            location: 'before',
            template: 'title'
        });
    }

    calculateFileSizeValue = (data: DocumentInfo) => this._fileSizePipe.transform(data.size);

    numerizeFileSizeSortValue = (rowData) => +rowData.size;

    onContentReady() {
        this.setGridDataLoaded();
    }

    ngOnDestroy() {
        this._clientService.toolbarUpdate();
        if (this.openDocumentMode) {
            this.closeDocument();
        }
    }

    showActionsMenu(data, target) {
        this.actionRecordData = data;
        this.actionMenuItems.find(menuItem => menuItem.text === this.l('Edit')).visible = data.isEditSupportedByWopi;
        setTimeout(() => {
            this.actionsTooltip.instance.show(target);
        });
    }

    onCellClick($event) {
        this.clickedCellKey = undefined;
        const target = $event.event.target;
        if ($event.rowType === 'data') {
            /** If user click on actions icon */
            if (target.closest('.dx-link.dx-link-edit')) {
                this.showActionsMenu($event.data, target);
            } else if (target.closest('.document-type')) {
                /** If user click on document type */
                this.clickedCellKey = $event.data.id;
            } else {
                this.currentDocumentInfo = $event.data;
                /** Save sorted visible rows to get next and prev properly */
                this.visibleDocuments = $event.component.getVisibleRows().map(row => row.data);
                /** If user click the whole row */
                this.viewDocument(DocumentType.Current, $event.event);
            }
        }
    }

    onMenuItemClick($event) {
        this.currentDocumentInfo = this.actionRecordData;
        $event.itemData.action.call(this);
        this.actionRecordData = null;
    }

    getFileType(fileName): string {
        const fileExtension = this.getFileExtensionByFileName(fileName);
        return this.getViewerType(fileExtension);
    }

    private getFileExtensionByFileName(fileName: string): string {
        return fileName && fileName.split('.').pop();
    }

    viewDocument(type: DocumentType = DocumentType.Current, event?: Event) {
        let currentDocumentIndex = this.visibleDocuments.indexOf(this.currentDocumentInfo);
        if (type !== DocumentType.Current) {
            currentDocumentIndex = currentDocumentIndex + type;
            const prevOrNextDocument = this.visibleDocuments[currentDocumentIndex];
            /** If there is no next or prev document - just don't do any action */
            if (!prevOrNextDocument) {
                return;
            }
            this.currentDocumentInfo = prevOrNextDocument;
        }

        const ext = this.getFileExtensionByFileName(this.currentDocumentInfo.fileName);
        const viewerType = this.getViewerType(ext);
        this.showViewerType = undefined;
        if (viewerType !== DocumentViewerType.UNKNOWN) {
            super.startLoading(true);
            this.initViewerToolbar({
                viewerType: viewerType,
                rotateDisabled: ext == 'pdf',
                editDisabled: !this.currentDocumentInfo.isEditSupportedByWopi,
                prevButtonDisabled: currentDocumentIndex === 0, // document is first in list
                nextButtonDisabled: currentDocumentIndex === this.visibleDocuments.length - 1, // document is last in list
                printHidden: viewerType === DocumentViewerType.IMAGE || viewerType === DocumentViewerType.VIDEO || ext === 'pdf'
            });
            switch (viewerType) {
                case DocumentViewerType.WOPI:
                    this.getViewWopiRequestInfoObservable().pipe(finalize(() => {
                        super.finishLoading(true);
                    })).subscribe((response) => {
                        this.showOfficeOnline(response);
                    });
                    break;
                case DocumentViewerType.VIDEO:
                    this.documentsService.getDocumentUrlInfoObservable(this.currentDocumentInfo.id).subscribe((urlInfo) => {
                        super.finishLoading(true);
                        this.showViewerType = viewerType;
                        this.openDocumentMode = true;
                    });
                    break;
                default:
                    this.documentsService.getDocumentUrlInfoObservable(this.currentDocumentInfo.id).subscribe((urlInfo) => {
                        this.downloadFileBlob(urlInfo.url, (blob) => {
                            if (viewerType === DocumentViewerType.ARCHIVE) {
                                this.archiveFiles$ = (ext === 'rar' ? this.getFilesInfoFromRarBlob(blob) : this.getFilesInfoFromZipBlob(blob)).pipe(tap(() => this.openDocumentMode = true));
                            } else {
                                let reader = new FileReader();
                                reader.addEventListener('loadend', () => {
                                    this.openDocumentMode = true;
                                    let content = StringHelper.getBase64(reader.result);
                                    this.previewContent = (
                                        viewerType === DocumentViewerType.TEXT
                                        || viewerType === DocumentViewerType.XML
                                        || viewerType === DocumentViewerType.CSV
                                    )
                                        ? atob(content)
                                        : content;
                                    if (viewerType === DocumentViewerType.XML) {
                                        const json = xmlJs.xml2js(
                                            this.sanitizeContent(this.previewContent),
                                            {
                                                compact: true,
                                                trim: true,
                                                ignoreDoctype: true,
                                                ignoreDeclaration: true,
                                                ignoreAttributes: true
                                            }
                                        );
                                        this.xmlContainerElementRef.nativeElement.innerHTML = '';
                                        this.renderer.appendChild(
                                            this.xmlContainerElementRef.nativeElement,
                                            new JSONFormatter(json, 2).render()
                                        );
                                    }
                                    if (viewerType === DocumentViewerType.CSV) {
                                        this.csvParser.parse(this.previewContent, {
                                            complete: (result: PapaParseResult) => {
                                                if (!result.errors || !result.errors.length) {
                                                    this.parsedCsv = result.data;
                                                }
                                            }
                                        });
                                    }
                                });
                                reader.readAsDataURL(blob);
                            }
                            this.showViewerType = viewerType;
                            super.finishLoading(true);
                        });
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
                    nextButtonDisabled: currentDocumentIndex === this.visibleDocuments.length - 1, // document is last in list
                    printHidden: true
                });
            }
            this.dialog.open(NotSupportedTypeDialogComponent, {
                data: {
                    documentId: this.currentDocumentInfo.id
                }
            });
            if (event && event.preventDefault) {
                event.preventDefault();
                event.stopPropagation();
            }
        }
    }

    getViewerType(extension: string): DocumentViewerType {
        let viewerType = DocumentViewerType.UNKNOWN;
        if (this.validWopiExtensions.indexOf(extension) >= 0) {
            viewerType = DocumentViewerType.WOPI;
        } else if (this.validCsvExtensions.indexOf(extension) >= 0) {
            viewerType = DocumentViewerType.CSV;
        } else if (this.validImageExtensions.indexOf(extension) >= 0) {
            viewerType = DocumentViewerType.IMAGE;
        } else if (this.validTextExtensions.indexOf(extension) >= 0) {
            viewerType = DocumentViewerType.TEXT;
        }  else if (this.validVideoExtensions.indexOf(extension) >= 0) {
            viewerType = DocumentViewerType.VIDEO;
        } else if (this.validArchiveExtensions.indexOf(extension) >= 0) {
            viewerType = DocumentViewerType.ARCHIVE;
        }  else if (this.validXmlExtensions.indexOf(extension) >= 0) {
            viewerType = DocumentViewerType.XML;
        }
        return viewerType;
    }

    private getFilesInfoFromRarBlob(blob: Blob) {
        return from(Rar.fromFile(blob)).pipe(
            pluck('entries'),
            map((archives: Rar.RarEntry[]) => archives.map((archive: Rar.RarEntry) => ({
                name: archive.name,
                date: archive.time
            })))
        );
    }

    private getFilesInfoFromZipBlob(blob: Blob) {
        return from(new jszip().loadAsync(blob)).pipe(
            pluck('files'),
            map(files => values(files))
        );
    }

    sanitizeContent(content: string): string {
        return content.replace(/&/g, '&amp;');
    }

    downloadFileBlob(url, callback) {
        let xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200)
                callback(this.response);
        };

        xhr.open('GET', url);
        xhr.responseType = 'blob';

        xhr.setRequestHeader('Access-Control-Allow-Headers', '*');
        xhr.setRequestHeader('Access-Control-Allow-Origin', '*');

        xhr.send();
    }

    editDocument() {
        this.initViewerToolbar({
            editDisabled: true
        });
        super.startLoading(true);
        this._documentService.getEditWopiRequestInfo(this.currentDocumentInfo.id).pipe(finalize(() => {
            super.finishLoading(true);
        })).subscribe((response) => {
            this.showOfficeOnline(response);
        });
    }

    showOfficeOnline(wopiRequestInfo: WopiRequestOutcoming) {
        this.showViewerType = DocumentViewerType.WOPI;
        this.wopiUrlsrc = wopiRequestInfo.wopiUrlsrc;
        this.wopiAccessToken = wopiRequestInfo.accessToken;
        this.wopiAccessTokenTtl = wopiRequestInfo.accessTokenTtl.toString();
        setTimeout(() => {
            this._frameHolderElementRef.innerHTML = '';
            this.openDocumentMode = true;
        });
        setTimeout(() => this.submitWopiRequest(), 500);
    }

    submitWopiRequest() {
        let office_frame = document.createElement('iframe');
        office_frame.name = 'office_frame';
        office_frame.id = 'office_frame';
        office_frame.title = 'Office Online Frame';
        office_frame.setAttribute('allowfullscreen', 'true');
        office_frame.setAttribute('frameBorder', '0');
        office_frame.onload = (event) => {
            let eventTarget = <HTMLFormElement>event.target;
            const documentViewContainerRect = this.documentViewContainerElementRef.nativeElement.getBoundingClientRect();
            eventTarget.width = window.innerWidth - documentViewContainerRect.left;
            eventTarget.height = window.innerHeight - documentViewContainerRect.top - 1;
        };
        this._frameHolderElementRef.appendChild(office_frame);
        let officeForm = <HTMLFormElement>document.getElementById('office_form');
        officeForm.submit();
    }

    deleteDocument() {
        this.message.confirm(
            this.l('DocumentDeleteWarningMessage', this.currentDocumentInfo.fileName),
            isConfirmed => {
                if (isConfirmed) {
                    super.startLoading(true);
                    this.showViewerType = undefined;
                    this.openDocumentMode = false;
                    this._documentService.delete(this.currentDocumentInfo.id).subscribe((response) => {
                        this.loadDocuments(() => {
                            if (this.actionsTooltip && this.actionsTooltip.visible) {
                                this.hideActionsMenu();
                            }
                            this.closeDocument();
                            super.finishLoading(true);
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
        this._clientService.toolbarUpdate();
    }

    @HostListener('document:keydown', ['$event'])
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
        this._documentService.updateType(UpdateTypeInput.fromJS({
            documentId: data.id,
            typeId: documentTypeId
        })).subscribe((response) => {
            if (!response) {
                this.clickedCellKey = undefined;
                data.typeId = documentTypeId;
                data.typeName = documentTypeId ?
                    this.documentTypes.find(item => item.id == documentTypeId).name :
                    undefined;
            }
        });
    }

    hideActionsMenu() {
        if (this.actionsTooltip && this.actionsTooltip.instance) {
            this.actionsTooltip.instance.hide();
        }
    }
}
