/** Core imports */
import {
    ViewChild,
    Component,
    ChangeDetectionStrategy,
    ChangeDetectorRef
} from '@angular/core';

/** Third party imports */
import RemoteFileSystemProvider from 'devextreme/file_management/remote_provider';
import { DxFileManagerComponent } from 'devextreme-angular/ui/file-manager';
import { loadMessages } from 'devextreme/localization';
import { finalize } from 'rxjs/operators';
import { ClipboardService } from 'ngx-clipboard';
import { forkJoin } from 'rxjs';

/** Application imports */
import { AppService } from '@app/app.service';
import { AppPermissions } from '@shared/AppPermissions';
import { PermissionCheckerService } from 'abp-ng2-module';
import { DocumentTemplatesServiceProxy, GetFileUrlDto } from '@shared/service-proxies/service-proxies';
import { AppUiCustomizationService } from '@shared/common/ui/app-ui-customization.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { LifecycleSubjectsService } from '@shared/common/lifecycle-subjects/lifecycle-subjects.service';
import { LoadingService } from '@shared/common/loading-service/loading.service';
import { AppConsts } from '@shared/AppConsts';
import { NotifyService } from 'abp-ng2-module';
import { MessageService } from 'abp-ng2-module';

@Component({
    templateUrl: './documents.component.html',
    styleUrls: ['./documents.component.less'],
    providers: [ LifecycleSubjectsService, DocumentTemplatesServiceProxy ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DocumentsComponent {
    @ViewChild(DxFileManagerComponent) fileManager: DxFileManagerComponent;

    private readonly VIEW_MODE_DETAILS    = 'details';
    private readonly VIEW_MODE_THUMBNAILS = 'thumbnails';

    layout = this.VIEW_MODE_THUMBNAILS;
    fileProvider = new RemoteFileSystemProvider({
        endpointUrl: AppConsts.remoteServiceBaseUrl + '/api/services/CRM/DocumentTemplates/FileSystem',
        beforeAjaxSend: (options) => {
            if (!options.headers || !options.headers['Authorization'])
                options.headers = {
                    Authorization: 'Bearer ' + abp.auth.getToken(),
                    ...(options.headers || {})
                };
        }
    });
    manageAllowed = this.permission.isGranted(AppPermissions.CRMFileStorageTemplatesManage);

    contextMenu = {
        items: [
            {
                name: 'copyPublicLink',
                icon: 'link',
                closeMenuOnClick: true,
                text: this.ls.l('CopyPublicLink'),
                onClick: this.copyPublicLink.bind(this)
            },
            {
                name: 'load',
                icon: 'download',
                closeMenuOnClick: true,
                text: this.ls.l('Download'),
                onClick: this.download.bind(this)
            }, 'rename', 'move', 'delete', 'refresh'
        ]
    };

    downloadButtonOptions = {
        name: this.ls.l('Download'),
        text: this.ls.l('Download'),
        icon: 'download',
        onClick: this.download.bind(this)
    };

    constructor(
        private appService: AppService,
        private loadingService: LoadingService,
        private documentProxy: DocumentTemplatesServiceProxy,
        private permission: PermissionCheckerService,
        private changeDetectorRef: ChangeDetectorRef,
        private lifeCycleSubject: LifecycleSubjectsService,
        private clipboardService: ClipboardService,
        private messageService: MessageService,
        private notifyService: NotifyService,
        public ui: AppUiCustomizationService,
        public ls: AppLocalizationService
    ) {
        loadMessages({
            'en': {
                'dxFileManager-newDirectoryName': this.ls.l('TypeDirectoryName'),
            }
        });
    }

    copyPublicLink(event) {
        let dir = this.fileManager.instance.getCurrentDirectory();
        let selectedItems = this.fileManager.instance.getSelectedItems().filter(item => !item.isDirectory);
        if (!selectedItems.length)
            return this.messageService.warn(this.ls.l('FilesAreAllowedOnly', this.ls.l('GeneratingLink')));

        let lastSelectedItem = selectedItems[selectedItems.length - 1];
        this.loadingService.startLoading();
        this.documentProxy.getUrl(~dir.key.indexOf('root') ? undefined : dir.key, lastSelectedItem.name, true).pipe(
            finalize(() => this.loadingService.finishLoading())
        ).subscribe((data: GetFileUrlDto) => {
            this.clipboardService.copyFromContent(data.url);
            this.notifyService.info(this.ls.l('SavedToClipboard'));
        });
    }

    download() {
        let dir = this.fileManager.instance.getCurrentDirectory(),
            items = this.fileManager.instance.getSelectedItems().filter(item => !item.isDirectory);

        if (!items.length)
            return this.messageService.warn(this.ls.l('FilesAreAllowedOnly', this.ls.l('Download')));

        let requests = items.map(item => this.documentProxy.getUrl(
            ~dir.key.indexOf('root') ? undefined : dir.key, item.name, false)
        );

        if (requests.length) {
            this.loadingService.startLoading();
            forkJoin.apply(forkJoin, requests).pipe(
                finalize(() => this.loadingService.finishLoading())
            ).subscribe((responce: GetFileUrlDto[]) => {
                responce.forEach((data: GetFileUrlDto, index: number) => {
                    setTimeout(() => {
                        window.open(data.url, '_blank');
                    }, index * 1000);
                });
            });
        }
    }

    getHeight() {
        return innerHeight - 150 + 'px';
    }

    refresh() {
        this.fileManager.instance.refresh();
    }

    customizeDetailColumns(columns) {
        return columns.map(column => {
            if (column.dataField == 'dateModified')
                column.width = 200;
            return column;
        });
    }

    activate() {
        this.ui.overflowHidden(true);
        this.lifeCycleSubject.activate.next();
        this.appService.toolbarIsHidden.next(true);
        this.changeDetectorRef.detectChanges();
    }

    deactivate() {
        this.ui.overflowHidden();
        this.appService.toolbarIsHidden.next(false);
        this.lifeCycleSubject.deactivate.next();
    }
}