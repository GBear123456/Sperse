/** Core imports */
import { Component, Injector, HostListener, OnInit,  OnDestroy, ViewChild } from '@angular/core';

/** Third party imports */
import { MatDialog } from '@angular/material';
import { DxDataGridComponent, DxTooltipComponent } from 'devextreme-angular';
import 'devextreme/data/odata/store';
import { ImageViewerComponent } from 'ng2-image-viewer';
import { FileSystemFileEntry } from 'ngx-file-drop';
import { finalize } from 'rxjs/operators';

/** Application imports */
import { UploadDocumentDialogComponent } from '@app/crm/clients/details/upload-document-dialog/upload-document-dialog.component';
import { AppConsts } from '@shared/AppConsts';
import { AppComponentBase } from '@shared/common/app-component-base';
import { CustomersServiceProxy, CustomerInfoDto, DocumentServiceProxy, UploadDocumentInput,
DocumentInfo, DocumentTypeServiceProxy, DocumentTypeInfo, UpdateTypeInput, WopiRequestOutcoming } from '@shared/service-proxies/service-proxies';
import { FileSizePipe } from '@shared/common/pipes/file-size.pipe';
import { PrinterService } from '@shared/common/printer/printer.service';
import { StringHelper } from '@shared/helpers/StringHelper';
import { DocumentType } from './document-type.enum';
import { ClientDetailsService } from '../client-details.service';


@Component({
    templateUrl: './documents.component.html',
    styleUrls: ['./documents.component.less'],
    providers: [ DocumentServiceProxy, DocumentTypeServiceProxy, FileSizePipe, PrinterService ]
})
export class DocumentsComponent extends AppComponentBase implements OnInit, OnDestroy {
    @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;
    @ViewChild(ImageViewerComponent) imageViewer: ImageViewerComponent;
    @ViewChild(DxTooltipComponent) actionsTooltip: DxTooltipComponent;

    private visibleDocuments: DocumentInfo[];
    private currentDocumentURL: string;

    public data: {
        customerInfo: CustomerInfoDto
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
    public showViewerType: number;
    public clickedCellKey: string;

    public readonly WOPI_VIEWER  = 0;
    public readonly IMAGE_VIEWER = 1;
    public readonly TEXT_VIEWER  = 2;
    public readonly VIDEO_VIEWER  = 3;

    public validTextExtensions: String[] = ['txt', 'text'];
    public validVideoExtensions: String[] = ['mp4', 'mov'];
    public viewerToolbarConfig: any = [];
    fileType: string;

    constructor(injector: Injector,
        public dialog: MatDialog,
        private _fileSizePipe: FileSizePipe,
        private _documentService: DocumentServiceProxy,
        private _documentTypeService: DocumentTypeServiceProxy,
        private _customerService: CustomersServiceProxy,
        private _clientService: ClientDetailsService,
        private printerService: PrinterService
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
                action: () => {
                    this._documentService.getUrl(this.currentDocumentInfo.id).subscribe(urlInfo => {
                        this.currentDocumentURL = urlInfo.url;
                        this.downloadDocument();
                        this.hideActionsMenu();
                    })
                }
            },
            {
                text: this.l('Delete'),
                action: this.deleteDocument.bind(this)
            }
        ];
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
                        html: '<div class="file-name">' + this.currentDocumentInfo.fileName +
                            '<span class="file-size">(' + this._fileSizePipe.transform(this.currentDocumentInfo.size) + ')</span></div>'
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
                            if (this.showViewerType !== this.WOPI_VIEWER) {
                                const printSrc = this.showViewerType == this.IMAGE_VIEWER ?
                                    this.imageViewer.images[0] :
                                    viewedDocument.textContent;
                                const format = <any>this.currentDocumentInfo.fileName.split('.').pop();
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
                        visible: conf.viewerType == this.IMAGE_VIEWER,
                        disabled: conf.rotateDisabled
                    },
                    {
                        name: 'rotateRight',
                        action: this.rotateImageRight.bind(this),
                        visible: conf.viewerType == this.IMAGE_VIEWER,
                        disabled: conf.rotateDisabled
                    }
                ]
            },
            {
                location: 'after', items: [
                    {
                        name: 'prev',
                        action: this.viewDocument.bind(this, DocumentType.Prev),
                        disabled: conf.prevButtonDisabled
                    },
                    {
                        name: 'next',
                        action: this.viewDocument.bind(this, DocumentType.Next),
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
        this.data = this._customerService['data'];
        this.loadDocumentTypes();
        this.loadDocuments();
    }

    loadDocumentTypes() {
        this._documentTypeService.getAll().subscribe((result) => {
            this.documentTypes = result;
        });
    }

    loadDocuments(callback = null) {
        this._documentService.getAll(this.data.customerInfo.id).subscribe((result) => {
            this.dataSource = result;
            callback && callback();
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
        if (this.openDocumentMode) {
            this.closeDocument();
        }
    }

    fileDropped($event) {
        let files = $event.files;
        if (files.length)
            this.uploadDroppedFile(files[0]);
    }

    uploadDroppedFile(droppedFile) {
        let fileEntry = droppedFile.fileEntry as FileSystemFileEntry;
        fileEntry.file((file: File) => this.openShowUploadDocumentDialog(file));
    }

    updateUploadProgress(data) {
        let elm = document.querySelector('file-drop .content');
        if (elm && data.progress < 90 || data.progress > 95)
            elm['style'].background = 'linear-gradient(to right, #e9f7fb ' + (data.progress++) + '%, #F8F7FC 0%)';
    }

    uploadFile(input) {
        let data = {progress: 0},
            progressInterval = setInterval(
                this.updateUploadProgress.bind(this, data),
                Math.round(input.size / 10000)
            );
        this._documentService.upload(UploadDocumentInput.fromJS({
            customerId: this.data.customerInfo.id,
            typeId: input.typeId,
            fileName: input.name,
            size: input.size,
            fileBase64: input.fileBase64
        })).pipe(finalize(() => {
            clearInterval(progressInterval);
            this.updateUploadProgress({progress: 100});
            setTimeout(() => {
                this.updateUploadProgress({progress: 0});
            }, 5000);
        })).subscribe(() => {    
            this.loadDocuments();
        }, (e) => {
            this.message.error(this.l('AnErrorOccurred'));
        });
    }

    showUploadDocumentDialog($event) {
        this.openShowUploadDocumentDialog();
        $event.stopPropagation();
    }

    openShowUploadDocumentDialog(file?: File) {
        this.dialog.open(UploadDocumentDialogComponent, {
            hasBackdrop: true,
            data: {
                file: file
            }
        }).afterClosed().subscribe((result) => {
            if (result)
                this.uploadFile(result);

            this.loadDocumentTypes();
        });
    }

    showActionsMenu(data, target) {
        this.actionRecordData = data;
        this.actionMenuItems.find(menuItem => menuItem.text === this.l('Edit')).visible = data.isEditSupportedByWopi;
        this.actionsTooltip.instance.show(target);
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
                this.viewDocument(DocumentType.Current);
            }
        }
    }

    onMenuItemClick($event) {
        this.currentDocumentInfo = this.actionRecordData;
        $event.itemData.action.call(this);
        this.actionRecordData = null;
    }

    viewDocument(type: DocumentType = DocumentType.Current) {
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

        this.currentDocumentURL = '';
        this.showViewerType = undefined;
        let ext = this.fileType = this.currentDocumentInfo.fileName.split('.').pop(),
            viewerType;

        if (this.validVideoExtensions.indexOf(ext) >= 0) {
            viewerType = this.VIDEO_VIEWER;
        } else {
            viewerType = this.currentDocumentInfo.isViewSupportedByWopi ? this.WOPI_VIEWER :
                (this.validTextExtensions.indexOf(ext) < 0 ?  this.IMAGE_VIEWER : this.TEXT_VIEWER);
        }

        this.startLoading(true);
        this.initViewerToolbar({
            viewerType: viewerType,
            rotateDisabled: ext == 'pdf',
            editDisabled: !this.currentDocumentInfo.isEditSupportedByWopi,
            prevButtonDisabled: currentDocumentIndex === 0, // document is first in list
            nextButtonDisabled: currentDocumentIndex === this.visibleDocuments.length - 1, // document is last in list
            printHidden: viewerType === this.WOPI_VIEWER
        });
        switch (viewerType) {
            case this.WOPI_VIEWER:
                this._documentService.getViewWopiRequestInfo(this.currentDocumentInfo.id).pipe(finalize(() => {
                    this.finishLoading(true);
                })).subscribe((response) => {
                    this.showOfficeOnline(response);
                });
                break;
            case this.VIDEO_VIEWER:
                this._documentService.getUrl(this.currentDocumentInfo.id).subscribe((urlInfo) => {
                    this.currentDocumentURL = urlInfo.url;
                    this.finishLoading(true);
                    this.showViewerType = viewerType;
                    this.openDocumentMode = true;
                });
                break;
            default:
                this._documentService.getUrl(this.currentDocumentInfo.id).subscribe((urlInfo) => {
                    this.currentDocumentURL = urlInfo.url;
                    this.downloadFileBlob(urlInfo.url, (blob) => {
                        let reader = new FileReader();
                        reader.addEventListener('loadend', () => {
                            let content = StringHelper.getBase64(reader.result);
                            this.previewContent = viewerType == this.TEXT_VIEWER ? atob(content): content;
                            this.showViewerType = viewerType;
                            this.openDocumentMode = true;
                        });
                        reader.readAsDataURL(blob);
                        this.finishLoading(true);
                    });
                });
                break;
        }
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
        this.startLoading(true);
        this._documentService.getEditWopiRequestInfo(this.currentDocumentInfo.id).pipe(finalize(() => {
            this.finishLoading(true);
        })).subscribe((response) => {
            this.showOfficeOnline(response);
        });
    }

    showOfficeOnline(wopiRequestInfo: WopiRequestOutcoming) {
        this.openDocumentMode = true;
        this.showViewerType = this.WOPI_VIEWER;
        this.wopiUrlsrc = wopiRequestInfo.wopiUrlsrc;
        this.wopiAccessToken = wopiRequestInfo.accessToken;
        this.wopiAccessTokenTtl = wopiRequestInfo.accessTokenTtl.toString();
        setTimeout(() => {
            this.submitWopiRequest();
        }, 500);
    }

    submitWopiRequest() {
        let frameholder = document.getElementById('frameholder');
        let office_frame = document.createElement('iframe');
        office_frame.name = 'office_frame';
        office_frame.id = 'office_frame';
        office_frame.title = 'Office Online Frame';
        office_frame.setAttribute('allowfullscreen', 'true');
        office_frame.setAttribute('frameBorder', '0');
        office_frame.onload = function(event) {
            let eventTarget = <HTMLFormElement>event.target;
            eventTarget.width = screen.width - 350;
            eventTarget.height = screen.height - 390;
        };
        frameholder.appendChild(office_frame);
        let officeForm = <HTMLFormElement>document.getElementById('office_form');
        officeForm.submit();
    }

    deleteDocument() {
        this.startLoading(true);
        this._documentService.delete(this.currentDocumentInfo.id).subscribe((response) => {
            this.loadDocuments(() => {
                if (this.actionsTooltip && this.actionsTooltip.visible) {
                    this.hideActionsMenu();
                }
                this.closeDocument();
                this.finishLoading(true);
            });
        });
    }

    downloadDocument() {
        if (this.currentDocumentURL)
            window.open(this.currentDocumentURL, '_self');
        else
            this._documentService.getUrl(this.currentDocumentInfo.id).subscribe((urlInfo) => {
                if (this.currentDocumentURL = urlInfo.url)
                    this.downloadDocument();
            });
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

    @HostListener('document:keydown', ['$event.keyCode'])
    handleKeyDown(keyCode: number) {
        if (this.openDocumentMode) {
            /** Arrow left is pressed */
            if (keyCode === 37) {
                this.viewDocument(DocumentType.Prev);
            }
            /** Arrow right is pressed */
            if (keyCode === 39) {
                this.viewDocument(DocumentType.Next);
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
