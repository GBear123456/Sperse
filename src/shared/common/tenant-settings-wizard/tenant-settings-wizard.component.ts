/** Core imports */
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    ViewChild,
    AfterViewInit,
    Inject
} from '@angular/core';

/** Third party imports */
import { MessageService } from 'abp-ng2-module';
import { MatVerticalStepper } from '@angular/material/stepper';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Observable, of } from 'rxjs';
import { finalize, map } from 'rxjs/operators';

/** Application imports */
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import {
    CommonLookupServiceProxy,
    EmailSettingsEditDto,
    GeneralSettingsEditDto,
    HostSettingsServiceProxy,
    HostUserManagementSettingsEditDto,
    SubscribableEditionComboboxItemDto,
    ListResultDtoOfSubscribableEditionComboboxItemDto,
    TenantManagementSettingsEditDto,
    TenantSettingsServiceProxy,
    TenantUserManagementSettingsEditDto,
    SecuritySettingsEditDto,
} from '@shared/service-proxies/service-proxies';
import { PermissionCheckerService } from 'abp-ng2-module';
import { AppPermissions } from '@shared/AppPermissions';
import { AppearanceComponent } from '@shared/common/tenant-settings-wizard/appearance/appearance.component';
import { GeneralSettingsComponent } from '@shared/common/tenant-settings-wizard/general-settings/general-settings.component';
import { LoadingService } from '@shared/common/loading-service/loading.service';
import { AppService } from '@app/app.service';
import { MemberPortalComponent } from '@shared/common/tenant-settings-wizard/member-portal/member-portal.component';
import { TenantSettingsStep } from '@shared/common/tenant-settings-wizard/tenant-settings-step.interface';
import { TenantManagementComponent } from '@shared/common/tenant-settings-wizard/tenant-management/tenant-management.component';
import { UserManagementComponent } from '@shared/common/tenant-settings-wizard/user-management/user-management.component';
import { SecurityComponent } from '@shared/common/tenant-settings-wizard/security/security.component';
import { EmailComponent } from '@shared/common/tenant-settings-wizard/email/email.component';
import { GmailSettingsComponent } from '@shared/common/tenant-settings-wizard/gmail-settings/gmail-settings.component';
import { ITenantSettingsStepComponent } from '@shared/common/tenant-settings-wizard/tenant-settings-step-component.interface';
import { FeatureCheckerService } from 'abp-ng2-module';
import { AppFeatures } from '@shared/AppFeatures';
import { InvoiceSettingsComponent } from './invoice-settings/invoice-settings.component';
import { CommissionsComponent } from './commissions/commissions.component';
import { BankTransferComponent } from './bank-transfer/bank-transfer.component';
import { OtherSettingsComponent } from './other-settings/other-settings.component';
import { LandingPageComponent } from './landing-page/landing-page.component';

@Component({
    selector: 'tenant-settings-wizard',
    templateUrl: 'tenant-settings-wizard.component.html',
    styleUrls: [
        'tenant-settings-wizard.component.less',
        '../styles/close-button.less'
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TenantSettingsWizardComponent implements AfterViewInit {
    @ViewChild(MatVerticalStepper, { static: true }) stepper: MatVerticalStepper;
    @ViewChild(AppearanceComponent) appearanceComponent: AppearanceComponent;
    @ViewChild(GeneralSettingsComponent) generalSettingsComponent: GeneralSettingsComponent;
    @ViewChild(TenantManagementComponent) tenantManagementComponent: TenantManagementComponent;
    @ViewChild(UserManagementComponent) userManagementComponent: UserManagementComponent;
    @ViewChild(SecurityComponent) securityComponent: SecurityComponent;
    @ViewChild(EmailComponent) emailComponent: EmailComponent;
    @ViewChild(GmailSettingsComponent) gmailSettingsComponent: GmailSettingsComponent;
    @ViewChild(MemberPortalComponent) memberPortalComponent: MemberPortalComponent;
    @ViewChild(InvoiceSettingsComponent) invoiceSettingsComponent: InvoiceSettingsComponent;
    @ViewChild(CommissionsComponent) commissionsComponent: CommissionsComponent;
    @ViewChild(BankTransferComponent) bankTransferComponent: BankTransferComponent;
    @ViewChild(OtherSettingsComponent) otherSettingsComponent: OtherSettingsComponent;
    @ViewChild(LandingPageComponent) landingPageComponent: LandingPageComponent;
    hasCustomizationsFeture = this.featureCheckerService.isEnabled(AppFeatures.AdminCustomizations);
    hasHostPermission = this.permissionCheckerService.isGranted(AppPermissions.AdministrationHostSettings);
    hasTenantPermission = this.permissionCheckerService.isGranted(AppPermissions.AdministrationTenantSettings);

    hasHostTenantOrCRMSettings = this.hasHostPermission || this.hasTenantPermission || this.permissionCheckerService.isGranted(AppPermissions.CRMSettingsConfigure);
    showInvoiceSettings = this.featureCheckerService.isEnabled(AppFeatures.CRMInvoicesManagement) && this.hasHostTenantOrCRMSettings;
    showCommissionsSettings = this.featureCheckerService.isEnabled(AppFeatures.CRMCommissions) &&
        (this.permissionCheckerService.isGranted(AppPermissions.CRMAffiliatesCommissionsManage) || this.hasHostPermission || this.hasTenantPermission);
    showBankTransferSettings = this.hasHostTenantOrCRMSettings;
    showOtherSettings = this.featureCheckerService.isEnabled(AppFeatures.CRMSubscriptionManagementSystem) && (this.hasHostPermission || this.hasTenantPermission);
    showLandingPageSettings = !this.appService.isHostTenant && this.featureCheckerService.isEnabled(AppFeatures.CRMTenantLandingPage) && this.permissionCheckerService.isGranted(AppPermissions.AdministrationUsers);

    steps: TenantSettingsStep[];
    generalSettings$: Observable<GeneralSettingsEditDto> = this.tenantSettingsService.getGeneralSettings();
    tenantManagementSettings$: Observable<TenantManagementSettingsEditDto> = this.hostSettingsService.getTenantManagementSettings();
    hostUserManagementSettings$: Observable<HostUserManagementSettingsEditDto> = this.hasHostPermission
        ? this.hostSettingsService.getUserManagementSettings()
        : of(null);
    tenantUserManagementSettings$: Observable<TenantUserManagementSettingsEditDto> = this.hasTenantPermission
        ? this.tenantSettingsService.getUserManagementSettings()
        : of(null);
    showTimezoneSelection: boolean = abp.clock.provider.supportsMultipleTimezone;
    editions$: Observable<SubscribableEditionComboboxItemDto[]> = this.commonLookupServiceProxy.getEditionsForCombobox(false).pipe(
        map((result: ListResultDtoOfSubscribableEditionComboboxItemDto) => {
            const notAssignedEdition: any = {
                value: null,
                displayText: this.ls.l('NotAssigned')
            };
            result.items.unshift(notAssignedEdition);
            return result.items;
        })
    );
    securitySettings$: Observable<SecuritySettingsEditDto> = this.tenantSettingsService.getSecuritySettings();
    emailSettings$: Observable<EmailSettingsEditDto> = this.tenantSettingsService.getEmailSettings();
    changedReloadOption: string;

    constructor(
        private featureCheckerService: FeatureCheckerService,
        private permissionCheckerService: PermissionCheckerService,
        private changeDetectorRef: ChangeDetectorRef,
        private dialogRef: MatDialogRef<TenantSettingsWizardComponent>,
        private hostSettingsService: HostSettingsServiceProxy,
        private tenantSettingsService: TenantSettingsServiceProxy,
        private loadingService: LoadingService,
        private elementRef: ElementRef,
        private messageService: MessageService,
        private commonLookupServiceProxy: CommonLookupServiceProxy,
        public ls: AppLocalizationService,
        public appService: AppService,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        this.dialogRef.afterClosed().subscribe(() => {
            if (!this.changedReloadOption)
                return;

            let message;
            switch (this.changedReloadOption) {
                case 'timezone':
                    message = this.ls.l('TimeZoneSettingChangedRefreshPageNotification');
                    break;
                case 'defaultCountry':
                    message = this.ls.l('DefaultSettingChangedRefreshPageNotification', this.ls.l('Country'));
                    break;
                case 'SignUpPageEnabled':
                    message = this.ls.l('SettingsChangedRefreshPageNotification', this.ls.l('General'));
                    break;
                case 'navPosition':
                    message = this.ls.l('SettingsChangedRefreshPageNotification', this.ls.l('NavigationMenuPosition'));
                    break;
                case 'currency':
                    message = this.ls.l('DefaultSettingChangedRefreshPageNotification', this.ls.l('Currency'));
                    break;
                case 'appearance':
                    message = this.ls.l('ReloadPageStylesMessage');
                    break;
                case 'tenantName':
                    message = this.ls.l('SettingsChangedRefreshPageNotification', this.ls.l('Tenant name'));
                    break;
            }

            this.messageService.info(message).done(() => {
                window.location.reload();
            });
        });
    }

    get visibleSteps() {
        return this.steps && this.steps.filter((step: TenantSettingsStep) => step.visible);
    }

    ngAfterViewInit() {
        this.dialogRef.updateSize("1400px", "900px");
        this.steps = [
            {
                name: 'general-settings',
                text: this.ls.l('GeneralSettings'),
                getComponent: () => this.generalSettingsComponent,
                saved: false,
                visible: true
            },
            {
                name: 'appearance',
                text: this.ls.l('Platform') + ' ' + this.ls.l('Appearance'),
                getComponent: () => this.appearanceComponent,
                saved: false,
                visible: !this.appService.isHostTenant && this.hasCustomizationsFeture
            },
            {
                name: 'tenant-management',
                text: this.ls.l('TenantManagement'),
                getComponent: () => this.tenantManagementComponent,
                saved: false,
                visible: this.hasHostPermission
            },
            {
                name: 'user-management',
                text: this.ls.l('UserManagement'),
                getComponent: () => this.userManagementComponent,
                saved: false,
                visible: true
            },
            {
                name: 'security',
                text: this.ls.l('Security'),
                getComponent: () => this.securityComponent,
                saved: false,
                visible: true
            },
            {
                name: 'email',
                text: this.ls.l('EmailSmtp'),
                getComponent: () => this.emailComponent,
                saved: false,
                visible: true
            },
            {
                name: 'gmail',
                text: this.ls.l('Gmail'),
                getComponent: () => this.gmailSettingsComponent,
                saved: false,
                visible: true
            },
            {
                name: 'member-portal',
                text: this.ls.l('MemberPortal'),
                getComponent: () => this.memberPortalComponent,
                saved: false,
                visible: !this.appService.isHostTenant && this.hasCustomizationsFeture
            },
            {
                name: 'invoice',
                text: this.ls.l('Invoice'),
                getComponent: () => this.invoiceSettingsComponent,
                saved: false,
                visible: this.showInvoiceSettings
            },
            {
                name: 'commissions',
                text: this.ls.l('Commissions'),
                getComponent: () => this.commissionsComponent,
                saved: false,
                visible: this.showCommissionsSettings
            },
            {
                name: 'bankTransfer',
                text: this.ls.l('BankTransfer'),
                getComponent: () => this.bankTransferComponent,
                saved: false,
                visible: this.showBankTransferSettings
            },
            {
                name: 'others',
                text: this.ls.l('SubscriptionManagement'),
                getComponent: () => this.otherSettingsComponent,
                saved: false,
                visible: this.showOtherSettings
            },
            {
                name: 'landingPage',
                text: this.ls.l('LandingPage'),
                getComponent: () => this.landingPageComponent,
                saved: false,
                visible: this.showLandingPageSettings
            }
        ];

        if (this.data && this.data.tab) {
            let selectedIndex = 0;
            this.steps.map((step, index) => {
                if (step.visible) {                    
                    if (step.name == this.data.tab) {
                        this.stepper.selectedIndex = selectedIndex;
                        this.changeDetectorRef.detectChanges();
                    }
                    selectedIndex++;
                }
            });
        }    
    }

    back() {
        this.stepper.selectedIndex = this.stepper.selectedIndex -= 1;
    }

    next() {
        const newIndex = this.stepper.selectedIndex + 1;
        if (newIndex > this.visibleSteps.length - 1) {
            this.close();
        } else {
            this.stepper.selectedIndex = newIndex;
        }
    }

    saveAndNext() {
        const currentStep = this.visibleSteps[this.stepper.selectedIndex];
        const currentStepComponent: ITenantSettingsStepComponent = currentStep.getComponent();
        if (currentStepComponent) {
            this.loadingService.startLoading(this.elementRef.nativeElement);
            currentStepComponent.save().pipe(
                finalize(() => this.loadingService.finishLoading(this.elementRef.nativeElement))
            ).subscribe(
                () => {
                    currentStep.saved = true;
                    this.next();
                },
                (e) => console.log(e)
            );
        } else {
            this.next();
        }
    }

    stepClick(index: number) {
        this.stepper.selectedIndex = index;
        this.changeDetectorRef.detectChanges();
    }

    onOptionChanged(option: string) {
        this.changedReloadOption = option;
    }

    close() {
        this.dialogRef.close();
    }
}