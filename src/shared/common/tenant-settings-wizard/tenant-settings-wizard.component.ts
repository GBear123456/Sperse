/** Core imports */
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    ViewChild,
    AfterViewInit
} from '@angular/core';

/** Third party imports */
import { MessageService } from 'abp-ng2-module';
import { MatVerticalStepper } from '@angular/material/stepper';
import { MatDialogRef } from '@angular/material/dialog';
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

@Component({
    selector: 'tenant-settings-wizard',
    templateUrl: 'tenant-settings-wizard.component.html',
    styleUrls: [ 'tenant-settings-wizard.component.less' ],
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
    hasCustomizationsFeture = this.featureCheckerService.isEnabled(AppFeatures.AdminCustomizations);
    hasHostPermission = this.permissionCheckerService.isGranted(AppPermissions.AdministrationHostSettings);
    hasTenantPermission = this.permissionCheckerService.isGranted(AppPermissions.AdministrationTenantSettings);

    hasHostTenantOrCRMSettings = this.hasHostPermission || this.hasTenantPermission || this.permissionCheckerService.isGranted(AppPermissions.CRMSettingsConfigure);
    showInvoiceSettings = this.featureCheckerService.isEnabled(AppFeatures.CRMInvoicesManagement) && this.hasHostTenantOrCRMSettings;
    showCommissionsSettings = this.featureCheckerService.isEnabled(AppFeatures.CRMCommissions) &&
        (this.permissionCheckerService.isGranted(AppPermissions.CRMAffiliatesCommissionsManage) || this.hasHostPermission || this.hasTenantPermission);
    showBankTransferSettings = this.hasHostTenantOrCRMSettings;
    showOtherSettings = this.featureCheckerService.isEnabled(AppFeatures.CRMSubscriptionManagementSystem) && (this.hasHostPermission || this.hasTenantPermission);

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
    generalSettingsChanged: Boolean;
    timezoneChanged: Boolean;
    countryChanged: Boolean;

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
        public appService: AppService
    ) {
        this.dialogRef.afterClosed().subscribe(() => {
            if (this.timezoneChanged)
                this.messageService.info(this.ls.l('TimeZoneSettingChangedRefreshPageNotification')).done(() => {
                    window.location.reload();
                });
            if (this.countryChanged)
                this.messageService.info(this.ls.l('DefaultSettingChangedRefreshPageNotification', this.ls.l('Country'))).done(() => {
                    window.location.reload();
                });
            if (this.generalSettingsChanged)
                this.messageService.info(this.ls.l('SettingsChangedRefreshPageNotification', this.ls.l('General'))).done(() => {
                    window.location.reload();
                });            
        });
    }

    get visibleSteps() {
        return this.steps && this.steps.filter((step: TenantSettingsStep) => step.visible);
    }

    ngAfterViewInit() {
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
                text: this.ls.l('Appearance'),
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
            }
        ];
    }

    back() {
        this.stepper.selectedIndex = this.stepper.selectedIndex -= 1;
    }

    next() {
        const newIndex = this.stepper.selectedIndex + 1;
        if (newIndex > this.visibleSteps.length - 1) {
            this.dialogRef.close();
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
        if (option == 'SignUpPageEnabled')
            this.generalSettingsChanged = true;
        if (option == 'timezone')
            this.timezoneChanged = true;
        if (option == 'defaultCountry')
            this.countryChanged = true;                        
    }
}