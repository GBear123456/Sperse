/** Core imports */
import {
    ViewChild,
    Component,
    ChangeDetectionStrategy,
    ChangeDetectorRef
} from '@angular/core';

/** Third party imports */
import RemoteFileProvider from 'devextreme/ui/file_manager/file_provider/remote';
import { DxFileManagerComponent } from 'devextreme-angular/ui/file-manager';
import { loadMessages } from 'devextreme/localization';
import { finalize } from 'rxjs/operators';
import { ClipboardService } from 'ngx-clipboard';

/** Application imports */
import { AppService } from '@app/app.service';
import { AppPermissions } from '@shared/AppPermissions';
import { PermissionCheckerService } from '@abp/auth/permission-checker.service';
import { DocumentTemplatesServiceProxy, GetFileUrlDto } from '@shared/service-proxies/service-proxies';
import { AppUiCustomizationService } from '@shared/common/ui/app-ui-customization.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { LifecycleSubjectsService } from '@shared/common/lifecycle-subjects/lifecycle-subjects.service';
import { LoadingService } from '@shared/common/loading-service/loading.service';
import { AppConsts } from '@shared/AppConsts';
import { NotifyService } from '@abp/notify/notify.service';

@Component({
    templateUrl: './documents.component.html',
    animations: [appModuleAnimation()],
    styleUrls: ['./documents.component.less'],
    providers: [ LifecycleSubjectsService, DocumentTemplatesServiceProxy ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DocumentsComponent {
    @ViewChild(DxFileManagerComponent, { static: false }) fileManager: DxFileManagerComponent;

    private readonly VIEW_MODE_DETAILS    = 'details';
    private readonly VIEW_MODE_THUMBNAILS = 'thumbnails';

    layout = this.VIEW_MODE_THUMBNAILS;
    fileProvider = new RemoteFileProvider({
        endpointUrl: AppConsts.remoteServiceBaseUrl + '/api/services/CRM/DocumentTemplates/FileSystem'
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

    constructor(
        private appService: AppService,
        private loadingService: LoadingService,
        private documentProxy: DocumentTemplatesServiceProxy,
        private permission: PermissionCheckerService,
        private changeDetectorRef: ChangeDetectorRef,
        private lifeCycleSubject: LifecycleSubjectsService,
        private clipboardService: ClipboardService,
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
        let selectedItems = this.fileManager.instance.getSelectedItems();
        let lastSelectedItem = selectedItems[selectedItems.length - 1];
        this.loadingService.startLoading();
        this.documentProxy.getUrl(~dir.key.indexOf('root') ? undefined : dir.key, lastSelectedItem.name, true).pipe(
            finalize(() => this.loadingService.finishLoading())
        ).subscribe((data: GetFileUrlDto) => {
            this.clipboardService.copyFromContent(data.url);
            this.notifyService.info(this.ls.l('SavedToClipboard'));
        });
    }

    download(event) {
        let dir = this.fileManager.instance.getCurrentDirectory();
        this.fileManager.instance.getSelectedItems().forEach(item => {
            this.loadingService.startLoading();
            this.documentProxy.getUrl(~dir.key.indexOf('root') ? undefined : dir.key, item.name, false).pipe(
                finalize(() => this.loadingService.finishLoading())
            ).subscribe((data: GetFileUrlDto) => {
                window.open(data.url, '_blank');
            });
        });
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

    onLayoutToogle() {
        this.layout = this.layout == this.VIEW_MODE_DETAILS
            ? this.VIEW_MODE_THUMBNAILS : this.VIEW_MODE_DETAILS;
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