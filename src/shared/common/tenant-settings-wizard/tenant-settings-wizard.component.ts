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
import { MatVerticalStepper } from '@angular/material/stepper';
import { MatDialogRef } from '@angular/material/dialog';
import { Observable, of } from 'rxjs';
import { finalize, publishReplay, refCount, map } from 'rxjs/operators';

/** Application imports */
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import {
    CommonLookupServiceProxy,
    GeneralSettingsEditDto,
    HostSettingsEditDto,
    HostSettingsServiceProxy,
    HostUserManagementSettingsEditDto,
    SubscribableEditionComboboxItemDto,
    SubscribableEditionComboboxItemDtoListResultDto,
    TenantManagementSettingsEditDto,
    TenantSettingsEditDto,
    TenantSettingsServiceProxy,
    TenantUserManagementSettingsEditDto
} from '@shared/service-proxies/service-proxies';
import { PermissionCheckerService } from '@abp/auth/permission-checker.service';
import { AppPermissions } from '@shared/AppPermissions';
import { GeneralSettingsComponent } from '@shared/common/tenant-settings-wizard/general-settings/general-settings.component';
import { LoadingService } from '@shared/common/loading-service/loading.service';
import { AppService } from '@app/app.service';
import { TenantSettingsStep } from '@shared/common/tenant-settings-wizard/tenant-settings-step.interface';
import { TenantManagementComponent } from '@shared/common/tenant-settings-wizard/tenant-management/tenant-management.component';
import { UserManagementComponent } from '@shared/common/tenant-settings-wizard/user-management/user-management.component';
import { SecurityComponent } from '@shared/common/tenant-settings-wizard/security/security.component';
import { EmailComponent } from '@shared/common/tenant-settings-wizard/email/email.component';

@Component({
    selector: 'tenant-settings-wizard',
    templateUrl: 'tenant-settings-wizard.component.html',
    styleUrls: [ 'tenant-settings-wizard.component.less' ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TenantSettingsWizardComponent implements AfterViewInit {
    @ViewChild(MatVerticalStepper, { static: true }) stepper: MatVerticalStepper;
    @ViewChild(GeneralSettingsComponent, { static: false }) generalSettingsComponent: GeneralSettingsComponent;
    @ViewChild(TenantManagementComponent, { static: false }) tenantManagementComponent: TenantManagementComponent;
    @ViewChild(UserManagementComponent, { static: false }) userManagementComponent: UserManagementComponent;
    @ViewChild(SecurityComponent, { static: false }) securityComponent: SecurityComponent;
    @ViewChild(EmailComponent, { static: false }) emailComponent: EmailComponent;
    hasHostPermission = this.permissionCheckerService.isGranted(AppPermissions.AdministrationHostSettings);
    hasTenantPermission = this.permissionCheckerService.isGranted(AppPermissions.AdministrationTenantSettings);
    steps: TenantSettingsStep[];
    hostSettings$: Observable<HostSettingsEditDto> = this.hasHostPermission
        ? this.hostSettingsService.getAllSettings().pipe(
            publishReplay(),
            refCount()
        )
        : of(null);
    tenantSettings$: Observable<TenantSettingsEditDto> = this.hasTenantPermission
        ? this.tenantSettingsService.getAllSettings().pipe(
            publishReplay(),
            refCount()
        )
        : of(null);
    settings$: Observable<TenantSettingsEditDto | HostSettingsEditDto> = this.hasHostPermission
        ? this.hostSettings$
        : this.tenantSettings$;
    generalSettings$: Observable<GeneralSettingsEditDto> = this.settings$.pipe(
        map((settings: TenantSettingsEditDto) => settings.general)
    );
    tenantManagementSettings$: Observable<TenantManagementSettingsEditDto> = this.hostSettings$.pipe(
        map((settings: HostSettingsEditDto) => settings && settings.tenantManagement)
    );
    hostUserManagementSettings$: Observable<HostUserManagementSettingsEditDto> = this.hostSettings$.pipe(
        map((settings: HostSettingsEditDto) => settings && settings.userManagement)
    );
    tenantUserManagementSettings$: Observable<TenantUserManagementSettingsEditDto> = this.tenantSettings$.pipe(
        map((settings: TenantSettingsEditDto) => settings && settings.userManagement)
    );
    showTimezoneSelection: boolean = abp.clock.provider.supportsMultipleTimezone;
    editions$: Observable<SubscribableEditionComboboxItemDto[]> = this.commonLookupServiceProxy.getEditionsForCombobox(false).pipe(
        map((result: SubscribableEditionComboboxItemDtoListResultDto) => {
            const notAssignedEdition: any = {
                value: null,
                displayText: this.ls.l('NotAssigned')
            };
            result.items.unshift(notAssignedEdition);
            return result.items;
        })
    );

    constructor(
        private permissionCheckerService: PermissionCheckerService,
        private changeDetectorRef: ChangeDetectorRef,
        private dialogRef: MatDialogRef<TenantSettingsWizardComponent>,
        private hostSettingsService: HostSettingsServiceProxy,
        private tenantSettingsService: TenantSettingsServiceProxy,
        private loadingService: LoadingService,
        private elementRef: ElementRef,
        private appService: AppService,
        private commonLookupServiceProxy: CommonLookupServiceProxy,
        public ls: AppLocalizationService
    ) {}

    get visibleSteps() {
        return this.steps && this.steps.filter((step: TenantSettingsStep) => step.visible);
    }

    ngAfterViewInit() {
        this.steps = [
            {
                name: 'general-settings',
                text: this.ls.l('GeneralSettings'),
                component: this.generalSettingsComponent,
                saved: false,
                visible: true
            },
            {
                name: 'tenant-management',
                text: this.ls.l('TenantManagement'),
                component: this.tenantManagementComponent,
                saved: false,
                visible: this.hasHostPermission
            },
            {
                name: 'user-management',
                text: this.ls.l('UserManagement'),
                component: this.userManagementComponent,
                saved: false,
                visible: true
            },
            {
                name: 'security',
                text: this.ls.l('Security'),
                component: this.securityComponent,
                saved: false,
                visible: true
            },
            {
                name: 'email',
                text: this.ls.l('EmailSMTP'),
                component: this.emailComponent,
                saved: false,
                visible: true
            }
        ];
    }

    back() {
        this.stepper.selectedIndex = this.stepper.selectedIndex -= 1;
    }

    next() {
        const newIndex = this.stepper.selectedIndex + 1;
        if (newIndex === this.visibleSteps.length - 1) {
            this.dialogRef.close();
        } else {
            this.stepper.selectedIndex = newIndex;
        }
    }

    saveAndNext() {
        const currentStep = this.visibleSteps[this.stepper.selectedIndex];
        if (currentStep.component) {
            this.loadingService.startLoading(this.elementRef.nativeElement);
            currentStep.component.save().pipe(
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
}