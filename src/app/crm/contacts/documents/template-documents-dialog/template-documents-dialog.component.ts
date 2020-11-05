/** Core imports */
import { Component, ViewChild, OnInit, AfterViewInit, Inject, ElementRef } from '@angular/core';

/** Third party imports */
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import RemoteFileProvider from 'devextreme/ui/file_manager/file_provider/remote';
import { DxFileManagerComponent } from 'devextreme-angular/ui/file-manager';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { NotifyService } from '@abp/notify/notify.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { LoadingService } from '@shared/common/loading-service/loading.service';

@Component({
    templateUrl: 'template-documents-dialog.component.html',
    styleUrls: ['template-documents-dialog.component.less']
})
export class TemplateDocumentsDialogComponent implements OnInit, AfterViewInit {
    @ViewChild(DxFileManagerComponent, { static: false }) fileManager: DxFileManagerComponent;

    private slider: any;
    private readonly VIEW_MODE_DETAILS    = 'details';
    private readonly VIEW_MODE_THUMBNAILS = 'thumbnails';

    layout = this.VIEW_MODE_THUMBNAILS;
    documentsFileProvider = new RemoteFileProvider({
        endpointUrl: AppConsts.remoteServiceBaseUrl + '/api/TenantFileManager/Files'
    });
    templatesFileProvider = new RemoteFileProvider({
        endpointUrl: AppConsts.remoteServiceBaseUrl + '/api/TenantFileManager/Files'
    });
    folderTabs = [
        {     
            id: 0,
            visible: this.data.showProviders,
            text: this.ls.l('Documents'),
            provider: this.documentsFileProvider,
            icon: "inactivefolder", 
        },
        { 
            id: 1,
            visible: true,
            text: this.ls.l('Templates'),
            provider: this.templatesFileProvider,
            icon: "activefolder", 
        }
    ];

    constructor(
        private elementRef: ElementRef,
        private notify: NotifyService,
        private loadingService: LoadingService,
        public dialogRef: MatDialogRef<TemplateDocumentsDialogComponent>,
        public ls: AppLocalizationService,
        @Inject(MAT_DIALOG_DATA) public data: any,
    ) {
        this.dialogRef.beforeClose().subscribe(() => {
            this.dialogRef.updatePosition({
                top: (this.data.fullHeight ? 0: 75) + 'px',
                right: '-100vw'
            });
        });
    }

    ngOnInit() {
        this.slider = this.elementRef.nativeElement.closest('.slider');
        this.slider.classList.add('hide', 'min-width-0');
        this.dialogRef.updateSize('0px', '0px');
        this.dialogRef.updatePosition({
            top: (this.data.fullHeight ? 0: 75) + 'px',
            right: '-100vw'
        });
    }

    ngAfterViewInit() {
        this.loadingService.startLoading(this.elementRef.nativeElement);
        setTimeout(() => {
            this.slider.classList.remove('hide');
            this.dialogRef.updateSize(undefined, '100vh');
            setTimeout(() => {
                this.dialogRef.updatePosition({
                    top: (this.data.fullHeight ? 0: 75) + 'px',
                    right: '0px'
                });
            }, 100);
        });
    }

    getHeight() {
        return innerHeight - 250 + 'px';
    }

    onContentReady() {
        setTimeout(() =>
            this.loadingService.finishLoading(
                this.elementRef.nativeElement
            ), 600
        );
    }

    onProviderChanged(event) {
        this.fileManager.instance.option(
            'fileProvider', 
            event.addedItems[0].provider
        );
        console.log(event);        
    }

    onAddFile() {
        this.dialogRef.close(
            this.fileManager.instance.getSelectedItems());
    }

    onLayoutToogle() {
        this.layout = this.layout == this.VIEW_MODE_DETAILS 
            ? this.VIEW_MODE_THUMBNAILS : this.VIEW_MODE_DETAILS;
    }

    close() {
        this.dialogRef.close();
    }
}