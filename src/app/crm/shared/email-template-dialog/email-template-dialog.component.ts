/** Core imports */
import { Component, ChangeDetectionStrategy, OnInit, ViewChild, Inject, ChangeDetectorRef } from '@angular/core';

/** Third party imports */
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DxContextMenuComponent } from 'devextreme-angular/ui/context-menu';
import { DxSelectBoxComponent } from 'devextreme-angular/ui/select-box';
import { DxTextBoxComponent } from 'devextreme-angular/ui/text-box';
import { CacheService } from 'ng2-cache-service';
import { finalize, filter, first } from 'rxjs/operators';
import { Observable } from 'rxjs';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { AppPermissions } from '@shared/AppPermissions';
import { AppPermissionService } from '@shared/common/auth/permission.service';
import { DialogService } from '@app/shared/common/dialogs/dialog.service';
import { CurrencyInfo } from '@shared/service-proxies/service-proxies';
import { NotifyService } from '@abp/notify/notify.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { CacheHelper } from '@shared/common/cache-helper/cache-helper';
import { MessageService } from '@abp/message/message.service';
import { IDialogButton } from '@shared/common/dialogs/modal/dialog-button.interface';
import { AppSessionService } from '@shared/common/session/app-session.service';

@Component({
    templateUrl: 'email-template-dialog.component.html',
    styleUrls: [ 'email-template-dialog.component.less' ],
    providers: [ CacheHelper, DialogService ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmailTemplateDialogComponent implements OnInit {
    buttons: IDialogButton[] = [
        {
            id: 'saveTemplateOptions',
            title: this.ls.l('Save'),
            class: 'primary',
            action: this.save.bind(this)
        }
    ];

    constructor(
        private cacheService: CacheService,
        private notifyService: NotifyService,
        private messageService: MessageService,
        private cacheHelper: CacheHelper,
        private dialogRef: MatDialogRef<EmailTemplateDialogComponent>,
        private changeDetectorRef: ChangeDetectorRef,
        private permission: AppPermissionService,
        public appSession: AppSessionService,
        public dialog: MatDialog,
        public ls: AppLocalizationService,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
    }

    ngOnInit() {
    }

    save(event?): void {
    }
}