/** Core imports */
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    ViewChild
} from '@angular/core';

/** Third party imports */
import { MatVerticalStepper } from '@angular/material/stepper';
import { MatDialogRef } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { finalize, publishReplay, refCount, map } from 'rxjs/operators';

/** Application imports */
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import {
    GeneralSettingsEditDto, HostSettingsEditDto, HostSettingsServiceProxy,
    TenantSettingsEditDto,
    TenantSettingsServiceProxy
} from '@shared/service-proxies/service-proxies';
import { PermissionCheckerService } from '@abp/auth/permission-checker.service';
import { AppPermissions } from '@shared/AppPermissions';
import { GeneralSettingsComponent } from '@shared/common/tenant-settings-wizard/general-settings/general-settings.component';
import { LoadingService } from '@shared/common/loading-service/loading.service';

@Component({
    selector: 'tenant-settings-wizard',
    templateUrl: 'tenant-settings-wizard.component.html',
    styleUrls: [ 'tenant-settings-wizard.component.less' ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TenantSettingsWizardComponent {
    @ViewChild(MatVerticalStepper, { static: true }) stepper: MatVerticalStepper;
    @ViewChild(GeneralSettingsComponent, { static: false }) generalSettingsComponent: GeneralSettingsComponent;
    steps = [
        {
            name: 'general-settings',
            text: this.ls.l('GeneralSettings'),
            componentName: 'generalSettingsComponent',
            saved: false
        },
        {
            name: 'tenant-manager',
            text: this.ls.l('TenantManager'),
            saved: false
        },
        {
            name: 'user-management',
            text: this.ls.l('UserManagement'),
            saved: false
        },
        {
            name: 'security',
            text: this.ls.l('Security'),
            saved: false
        },
        {
            name: 'email',
            text: this.ls.l('EmailSMTP'),
            saved: false
        }
    ];
    settings$: Observable<TenantSettingsEditDto | HostSettingsEditDto> = (
        this.permissionCheckerService.isGranted(AppPermissions.AdministrationHostSettings)
        ? this.hostSettingsService.getAllSettings().pipe(
            publishReplay(),
            refCount()
        )
        : this.tenantSettingsService.getAllSettings().pipe(
            publishReplay(),
            refCount()
        )
    );
    generalSettings: Observable<GeneralSettingsEditDto> = this.settings$.pipe(
        map((settings: TenantSettingsEditDto) => settings.general)
    );
    showTimezoneSelection: boolean = abp.clock.provider.supportsMultipleTimezone;

    constructor(
        private permissionCheckerService: PermissionCheckerService,
        private changeDetectorRef: ChangeDetectorRef,
        private dialogRef: MatDialogRef<TenantSettingsWizardComponent>,
        private hostSettingsService: HostSettingsServiceProxy,
        private tenantSettingsService: TenantSettingsServiceProxy,
        private loadingService: LoadingService,
        private elementRef: ElementRef,
        public ls: AppLocalizationService
    ) {}

    back() {
        this.stepper.selectedIndex = this.stepper.selectedIndex -= 1;
    }

    next() {
        const newIndex = this.stepper.selectedIndex + 1;
        if (newIndex === this.steps.length - 1) {
            this.dialogRef.close();
        } else {
            this.stepper.selectedIndex = newIndex;
        }
    }

    saveAndNext() {
        if (this.steps[this.stepper.selectedIndex].componentName) {
            this.loadingService.startLoading(this.elementRef.nativeElement);
            this[this.steps[this.stepper.selectedIndex].componentName].save().pipe(
                finalize(() => this.loadingService.finishLoading(this.elementRef.nativeElement))
            ).subscribe(
                () => this.next(),
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