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

/** Application imports */
import { AppService } from '@app/app.service';
import { AppUiCustomizationService } from '@shared/common/ui/app-ui-customization.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { LifecycleSubjectsService } from '@shared/common/lifecycle-subjects/lifecycle-subjects.service';
import { AppConsts } from '@shared/AppConsts';

@Component({
    templateUrl: './documents.component.html',
    animations: [appModuleAnimation()],
    styleUrls: ['./documents.component.less'],
    providers: [ LifecycleSubjectsService ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DocumentsComponent {
    @ViewChild(DxFileManagerComponent, { static: false }) fileManager: DxFileManagerComponent;

    fileProvider = new RemoteFileProvider({
        endpointUrl: AppConsts.remoteServiceBaseUrl + '/api/TenantFileManager/Files'
    });
    allowedFileExtensions = ['.csv', '.txt', '.doc', '.docx', '.xls', '.xlsx', '.jpg', '.jpeg', '.png', '.tiff', '.pdf'];
    contextMenu = {
        items: [            
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
        private changeDetectorRef: ChangeDetectorRef,
        private lifeCycleSubject: LifecycleSubjectsService,
        public ui: AppUiCustomizationService,
        public ls: AppLocalizationService
    ) {}

    download(event) {
        this.fileManager.instance.getSelectedItems().forEach(item => {
            //this.documentsService.downloadDocument(item.key);
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