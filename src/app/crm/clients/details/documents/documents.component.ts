/** Core imports */
import { AfterViewInit, Component, Injector, HostListener, OnInit,  OnDestroy, ViewChild } from '@angular/core';

/** Third party imports */
import { DxDataGridComponent, DxTooltipComponent } from 'devextreme-angular';
import 'devextreme/data/odata/store';
import { ImageViewerComponent } from 'ng2-image-viewer';
import { FileSystemFileEntry } from 'ngx-file-drop';
import { finalize } from 'rxjs/operators';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { AppComponentBase } from '@shared/common/app-component-base';
import { CustomersServiceProxy, CustomerInfoDto, DocumentServiceProxy, UploadDocumentInput,
    DocumentInfo, WopiRequestOutcoming } from '@shared/service-proxies/service-proxies';
import { FileSizePipe } from '@shared/common/pipes/file-size.pipe';
import { PrinterService } from '@shared/common/printer/printer.service';
import { MatDialog } from '@angular/material';
import { DocumentType } from './document-type.enum';
import { UploadDocumentDialogComponent } from '@app/crm/clients/details/upload-document-dialog/upload-document-dialog.component';
import { ClientDetailsService } from '../client-details.service';

@Component({
    templateUrl: './documents.component.html',
    styleUrls: ['./documents.component.less'],
    providers: [ DocumentServiceProxy, FileSizePipe, PrinterService ]
})
export class DocumentsComponent extends AppComponentBase implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;
    @ViewChild(ImageViewerComponent) imageViewer: ImageViewerComponent;
    @ViewChild(DxTooltipComponent) actionsTooltip: DxTooltipComponent;

    private visibleDocuments: DocumentInfo[];
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
    public wopiUrlsrc: string;
    public wopiAccessToken: string;
    public wopiAccessTokenTtl: string;
    public showViewerType: number;

    public readonly WOPI_VIEWER  = 0;
    public readonly IMAGE_VIEWER = 1;
    public readonly TEXT_VIEWER  = 2;

    public validTextExtensions: String[] = ['txt', 'text'];
    public viewerToolbarConfig: any = [];

    constructor(injector: Injector,
        public dialog: MatDialog,
        private _fileSizePipe: FileSizePipe,
        private _documentService: DocumentServiceProxy,
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
                    }
                ]
            },
            {
                location: 'after', items: [
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
                        action: Function()
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
        this.loadDocuments();
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

    ngAfterViewInit(): void {
    }

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
        if (data.progress < 90 || data.progress > 95)
            document.querySelector('file-drop .content')['style'].background =
                'linear-gradient(to right, #e9f7fb ' + (data.progress++) + '%, #F8F7FC 0%)';
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
            setTimeout(() => {
                this.updateUploadProgress({progress: 0});
            }, 5000);
        })).subscribe(() => {
            data.progress = 100;
            this.updateUploadProgress(data);
            clearInterval(progressInterval);

            this.loadDocuments();
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
        });
    }

    showActionsMenu(data, target) {
        this.actionRecordData = data;
        this.actionMenuItems.find(menuItem => menuItem.text === this.l('Edit')).disabled = !data.isSupportedByWopi;
        this.actionsTooltip.instance.show(target);
    }

    onCellClick($event) {
        const target = $event.event.target;
        if ($event.rowType === 'data') {
            /** If user click on actions icon */
            if (target.closest('.dx-link.dx-link-edit')) {
                this.showActionsMenu($event.data, target);
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

        let ext = this.currentDocumentInfo.fileName.split('.').pop();
        this.showViewerType = this.currentDocumentInfo.isSupportedByWopi ? this.WOPI_VIEWER :
            (this.validTextExtensions.indexOf(ext) < 0 ?  this.IMAGE_VIEWER : this.TEXT_VIEWER);

        this.startLoading(true);
        this.initViewerToolbar({
            editDisabled: !this.currentDocumentInfo.isSupportedByWopi,
            prevButtonDisabled: currentDocumentIndex === 0, // document is first in list
            nextButtonDisabled: currentDocumentIndex === this.visibleDocuments.length - 1, // document is last in list
            printHidden: this.showViewerType === this.WOPI_VIEWER
        });
        this._clientService.toolbarUpdate(this.viewerToolbarConfig);
        if (this.showViewerType == this.WOPI_VIEWER)
            this._documentService.getViewWopiRequestInfo(this.currentDocumentInfo.id).pipe(finalize(() => {
                this.finishLoading(true);
            })).subscribe((response) => {
                this.submitWopiRequest(response);
            });
        else
            this._documentService.getContent(this.currentDocumentInfo.id).pipe(finalize(() => {
                this.finishLoading(true);
            })).subscribe((response) => {
                this.previewContent = this.showViewerType == this.TEXT_VIEWER ? atob(response) : response;
                this.openDocumentMode = true;
            });
    }

    editDocument() {
        this.initViewerToolbar({
            editDisabled: true
        });
        this.startLoading(true);
        this._clientService.toolbarUpdate(this.viewerToolbarConfig);
        this._documentService.getEditWopiRequestInfo(this.currentDocumentInfo.id).pipe(finalize(() => {
            this.finishLoading(true);
        })).subscribe((response) => {
            this.submitWopiRequest(response);
        });
    }

    submitWopiRequest(wopiRequestInfo: WopiRequestOutcoming) {
        this.openDocumentMode = true;
        this.showViewerType = this.WOPI_VIEWER;
        this.wopiUrlsrc = wopiRequestInfo.wopiUrlsrc;
        this.wopiAccessToken = wopiRequestInfo.accessToken;
        this.wopiAccessTokenTtl = wopiRequestInfo.accessTokenTtl.toString();
        setTimeout(() => {
            window['submitWopiRequest']();
        }, 500);
    }

    deleteDocument() {
        this.startLoading(true);
        this._documentService.delete(this.currentDocumentInfo.id).subscribe((response) => {
            this.loadDocuments(() => {
                this.closeDocument();
                this.finishLoading(true);
            });
        });
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
}
