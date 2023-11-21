/** Core imports */
import {
    Component,
    ChangeDetectionStrategy,
    Inject,
    OnInit,
    ChangeDetectorRef,
    ViewChild
} from '@angular/core';

/** Third party imports */
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { finalize } from 'rxjs/operators';

/** Application imports */
import {
    TenantLandingPageInfo,
    TenantLandingPageUpdateInfo,
    TenantLandinPageServiceProxy
} from '@shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { NotifyService } from 'abp-ng2-module';
import { IDialogButton } from '@shared/common/dialogs/modal/dialog-button.interface';
import { ModalDialogComponent } from '@shared/common/dialogs/modal/modal-dialog.component';

@Component({
    styleUrls: ['./tenant-landing-page-modal.component.less'],
    templateUrl: './tenant-landing-page-modal.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [TenantLandinPageServiceProxy]
})
export class TenantLandingPageModalComponent implements OnInit {
    @ViewChild(ModalDialogComponent, { static: true }) modalDialog: ModalDialogComponent;

    buttons: IDialogButton[] = [
        {
            title: this.ls.l('Save'),
            class: 'primary',
            action: this.save.bind(this)
        }
    ];
    title: string = this.ls.l('TenantLandingPageConfig');

    landingPageInfo: TenantLandingPageInfo;

    constructor(
        private tenantLandingPageService: TenantLandinPageServiceProxy,
        private dialogRef: MatDialogRef<TenantLandingPageModalComponent>,
        private notifyService: NotifyService,
        private changeDetectorRef: ChangeDetectorRef,
        public ls: AppLocalizationService,
        @Inject(MAT_DIALOG_DATA) private data: any
    ) { }

    ngOnInit() {
        this.modalDialog.startLoading();
        this.tenantLandingPageService.get(this.data.tenantId)
            .pipe(finalize(() => this.modalDialog.finishLoading()))
            .subscribe(result => {
                this.landingPageInfo = result;
                this.changeDetectorRef.detectChanges();
            });
    }

    openLink(domain: string) {
        window.open(`https://${domain}`, '_blank');
    }

    save(): void {
        this.modalDialog.startLoading();
        this.tenantLandingPageService.update(new TenantLandingPageUpdateInfo({
            tenantId: this.landingPageInfo.tenantId,
            verified: this.landingPageInfo.verified,
            disabled: this.landingPageInfo.disabled
        })).pipe(finalize(() => this.modalDialog.finishLoading()))
            .subscribe(() => {
                this.notifyService.info(this.ls.l('SavedSuccessfully'));
                this.close(true);
            });
    }

    close(dataChanged = false): void {
        this.dialogRef.close(dataChanged);
    }
}
