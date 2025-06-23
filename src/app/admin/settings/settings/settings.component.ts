/** Core imports */
import {
    Component, Injector, OnInit, ViewChild, ElementRef, HostBinding,
    OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';

/** Third party imports */
import { Subject } from 'rxjs';
import { first, delay, finalize } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { MatVerticalStepper } from '@angular/material/stepper';

/** Application imports */
import { HeadlineButton } from '@app/shared/common/headline/headline-button.model';
import { AppComponentBase } from '@shared/common/app-component-base';
import { LayoutService } from '@app/shared/layout/layout.service';
import {
    ExternalLoginSettingsDto,
    LayoutType,
    TenantSettingsServiceProxy
} from '@shared/service-proxies/service-proxies';
import { AppFeatures } from '@shared/AppFeatures';
import { AppPermissions } from '@shared/AppPermissions';
import { AppService } from '@app/app.service';

@Component({
    templateUrl: './settings.component.html',
    styleUrls: ['../../../shared/common/styles/checkbox-radio.less', './settings.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [TenantSettingsServiceProxy]
})
export class SettingsComponent extends AppComponentBase implements OnInit, OnDestroy {
    @ViewChild(MatVerticalStepper) stepper: MatVerticalStepper;
    @ViewChild('tabGroup') tabGroup: ElementRef;
    @HostBinding('class.showLeftBar') showLeftBar;

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
    saveSubject: Subject<any> = new Subject();

    public headlineButtons: HeadlineButton[] = [
        {
            enabled: true,
            icon: 'la la la-floppy-o',
            action: () => {
                this.saveSubject.next();
            },
            label: this.l('Save Settings')
        }
    ];

    constructor(
        injector: Injector,
        private route: ActivatedRoute,
        private tenantSettingsService: TenantSettingsServiceProxy,
        private changeDetector: ChangeDetectorRef,
        public layoutService: LayoutService,
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
        this.showLeftBar = this.layoutService.showLeftBar;
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
            { key: 'Gmail', visible: true },
            { key: 'SendGrid', visible: !this.appService.isHostTenant },
            { key: 'Mailchimp', visible: true },
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
            { key: 'Google', visible: this.isSocialLoginEnabled('Google') },
            { key: 'Discord', visible: this.isSocialLoginEnabled('Discord') }
        ];

        this.visibleSettings = this.settingsConfig.filter(v => v.visible);
        this.visibleSettings.forEach((v, i) => v['index'] = i);
    }

    checkParams() {
        this.route.queryParams.pipe(
            first(), delay(100)
        ).subscribe(params => {
            if (params['tab']) {
                let keyName = params['tab'] == 'smtp' ? 'EmailSmtp' : params['tab'];
                let item = this.visibleSettings.find(
                    v => v.key.toLowerCase() == keyName.toLowerCase()
                );
                if (item) {
                    this.stepper.selectedIndex = item.index;
                    this.changeDetector.detectChanges();
                }
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
