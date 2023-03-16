/** Core imports */
import {
    Component, Injector, OnInit, ViewChild, ElementRef,
    OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';

/** Third party imports */
import { first, delay, finalize } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { MatVerticalStepper } from '@angular/material/stepper';

/** Application imports */
import { AppComponentBase } from '@shared/common/app-component-base';
import {
    ExternalLoginSettingsDto,
    LayoutType,
    TenantSettingsServiceProxy
} from '@shared/service-proxies/service-proxies';
import { AppFeatures } from '@shared/AppFeatures';
import { AppPermissions } from '@shared/AppPermissions';
import { AppService } from '@app/app.service';
import { DomHelper } from '@shared/helpers/DomHelper';

@Component({
    templateUrl: './settings.component.html',
    styleUrls: ['../../../shared/common/styles/checkbox-radio.less', './settings.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [TenantSettingsServiceProxy]
})
export class SettingsComponent extends AppComponentBase implements OnInit, OnDestroy {
    @ViewChild('tabGroup') tabGroup: ElementRef;
    @ViewChild(MatVerticalStepper) stepper: MatVerticalStepper;

    private rootComponent;

    isPaymentsEnabled: boolean = abp.features.isEnabled(AppFeatures.CRMPayments);
    isInboundOutboundSMSEnabled: boolean = abp.features.isEnabled(AppFeatures.InboundOutboundSMS);
    isAdminCustomizations: boolean = abp.features.isEnabled(AppFeatures.AdminCustomizations);
    isPFMApplicationsFeatureEnabled: boolean = abp.features.isEnabled(AppFeatures.PFM) && abp.features.isEnabled(AppFeatures.PFMApplications);
    isRapidTenantLayout: boolean = this.appSession.tenant && this.appSession.tenant.customLayoutType == LayoutType.Rapid;
    isSalesTalkEnabled: boolean = abp.features.isEnabled(AppFeatures.CRMSalesTalk) && this.permission.isGranted(AppPermissions.CRMSettingsConfigure);

    hasHostPermission = this.isGranted(AppPermissions.AdministrationHostSettings);
    hasTenantPermission = this.isGranted(AppPermissions.AdministrationTenantSettings);
    isTenantHosts: boolean = this.isGranted(AppPermissions.AdministrationTenantHosts);

    externalLoginSettings: ExternalLoginSettingsDto;

    settingsConfig: { key: string, visible: boolean, index?: number }[] = [];
    visibleSettings: { key: string, visible: boolean, index?: number }[] = [];

    constructor(
        injector: Injector,
        private route: ActivatedRoute,
        private tenantSettingsService: TenantSettingsServiceProxy,
        private changeDetector: ChangeDetectorRef,
        private appService: AppService,
        public dialog: MatDialog
    ) {
        super(injector);
        this.rootComponent = this.getRootComponent();
        this.rootComponent.overflowHidden(true);
    }

    ngOnInit(): void {
        this.startLoading(true);
        this.appService.isClientSearchDisabled = true;
        this.tenantSettingsService.getEnabledSocialLoginSettings()
            .pipe(finalize(() => this.finishLoading(true)))
            .subscribe(res => {
                this.externalLoginSettings = res;
                this.initMenu();
                this.checkParams();
                this.changeDetector.detectChanges();
            });
    }

    initMenu() {
        this.settingsConfig = [
            { key: 'General', visible: true },
            { key: 'TenantManagement', visible: this.appService.isHostTenant && this.hasHostPermission },
            { key: 'Appearance', visible: !this.appService.isHostTenant && this.isAdminCustomizations },
            { key: 'UserRegistration', visible: true },
            { key: 'Security', visible: true },
            { key: 'Domain', visible: this.isAdminCustomizations && this.isTenantHosts },
            { key: 'MemberPortal', visible: !this.appService.isHostTenant && this.isAdminCustomizations },
            { key: 'EmailSmtp', visible: true },
            { key: 'SendGrid', visible: !this.appService.isHostTenant },
            { key: 'Klaviyo', visible: !this.appService.isHostTenant },
            { key: 'YTel', visible: this.isInboundOutboundSMSEnabled },
            { key: 'Bugsnag', visible: this.appService.isHostTenant },
            { key: 'PayPal', visible: this.isPaymentsEnabled },
            { key: 'Stripe', visible: this.isPaymentsEnabled },
            //{ key: 'IDCS Link', visible: this.isCreditReportFeatureEnabled },
            { key: 'EPCVIPLink', visible: !this.appService.isHostTenant && this.isPFMApplicationsFeatureEnabled },
            { key: 'EPCVIPEmail', visible: !this.appService.isHostTenant && this.isPFMApplicationsFeatureEnabled },
            { key: 'IAge', visible: !this.appService.isHostTenant && this.isPFMApplicationsFeatureEnabled },
            { key: 'Ongage', visible: !this.appService.isHostTenant && this.isPFMApplicationsFeatureEnabled },
            { key: 'Rapid', visible: this.isRapidTenantLayout },
            { key: 'Sales Talk', visible: !this.appService.isHostTenant && this.isSalesTalkEnabled },
            { key: 'LinkedIn', visible: this.isSocialLoginEnabled('LinkedIn') },
            { key: 'Facebook', visible: this.isSocialLoginEnabled('Facebook') },
            { key: 'Discord', visible: this.isSocialLoginEnabled('Discord') }
        ];

        this.visibleSettings = this.settingsConfig.filter(v => v.visible);
        this.visibleSettings.forEach((v, i) => v['index'] = i);
    }

    checkParams() {
        this.route.queryParams.pipe(
            first(), delay(100)
        ).subscribe(params => {
            if (params['tab'] == 'smtp') {
                let emailIndex = this.visibleSettings.find(v => v.key == 'EmailSmtp').index;
                this.stepper.selectedIndex = emailIndex;
                this.changeDetector.detectChanges();
            }
        });
    }

    isSocialLoginEnabled(name: string): boolean {
        return this.externalLoginSettings && this.externalLoginSettings.enabledSocialLoginSettings.indexOf(name) !== -1;
    }

    onMenuSelect(event) {
        this.stepper.selectedIndex = event.addedItems[0].index;
        this.changeDetector.detectChanges();
    }

    ngOnDestroy() {
        this.rootComponent.overflowHidden(false);
    }
}
