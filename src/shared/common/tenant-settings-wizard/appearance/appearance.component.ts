/** Core imports */
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ViewChild
} from '@angular/core';

/** Third party imports */
import { forkJoin, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/** Application imports */
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import {
    TenantLoginInfoDto,
    TenantCustomizationServiceProxy
} from '@shared/service-proxies/service-proxies';
import { AppConsts } from '@shared/AppConsts';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { UploaderComponent } from '@shared/common/tenant-settings-wizard/general-settings/uploader/uploader.component';
import { ITenantSettingsStepComponent } from '@shared/common/tenant-settings-wizard/tenant-settings-step-component.interface';
import { FaviconService } from '@shared/common/favicon-service/favicon.service';
import { NotifyService } from '@abp/notify/notify.service';

@Component({
    selector: 'appearance',
    templateUrl: 'appearance.component.html',
    styleUrls: [
        '../shared/styles/common.less',
        'appearance.component.less'
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppearanceComponent implements ITenantSettingsStepComponent {
    @ViewChild('logoUploader', { static: false }) logoUploader: UploaderComponent;
    @ViewChild('cssUploader', { static: false }) cssUploader: UploaderComponent;
    @ViewChild('faviconsUploader', { static: false }) faviconsUploader: UploaderComponent;
    tenant: TenantLoginInfoDto = this.appSession.tenant;
    remoteServiceBaseUrl = AppConsts.remoteServiceBaseUrl;

    constructor(
        private notify: NotifyService,
        private appSession: AppSessionService,
        private faviconsService: FaviconService,
        private tenantCustomizationService: TenantCustomizationServiceProxy,
        public changeDetectorRef: ChangeDetectorRef,
        public ls: AppLocalizationService
    ) {}

    save(): Observable<any> {
        return forkJoin(
            this.logoUploader.uploadFile().pipe(tap((res: any) => {
                this.tenant.logoId = res.result && res.result.id;
                this.changeDetectorRef.detectChanges();
            })),
            this.cssUploader.uploadFile().pipe(tap((res: any) => {
                this.tenant.customCssId = res.result && res.result.id;
                this.changeDetectorRef.detectChanges();    
            })),
            this.faviconsUploader.uploadFile()
        );
    }

    clearLogo(): void {
        this.tenantCustomizationService.clearLogo().subscribe(() => {
            this.tenant.logoFileType = null;
            this.tenant.logoId = null;
            this.notify.info(this.ls.l('ClearedSuccessfully'));
            this.changeDetectorRef.detectChanges();
        });
    }

    clearFavicons(): void {
        this.tenantCustomizationService.clearFavicons().subscribe(() => {
            this.faviconsService.resetFavicons();
            this.notify.info(this.ls.l('ClearedSuccessfully'));
            this.changeDetectorRef.detectChanges();
        });
    }

    clearCustomCss(): void {
        this.tenantCustomizationService.clearCustomCss().subscribe(() => {
            this.tenant.customCssId = null;
            this.notify.info(this.ls.l('ClearedSuccessfully'));
            this.changeDetectorRef.detectChanges();
        });
    }
}