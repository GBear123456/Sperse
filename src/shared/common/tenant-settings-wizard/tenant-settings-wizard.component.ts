import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { MatVerticalStepper } from '@angular/material/stepper';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
    selector: 'tenant-settings-wizard',
    templateUrl: 'tenant-settings-wizard.component.html',
    styleUrls: [ 'tenant-settings-wizard.component.less' ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TenantSettingsWizardComponent {
    @ViewChild(MatVerticalStepper, { static: true }) stepper: MatVerticalStepper;
    steps = [
        {
            name: 'general-settings',
            text: this.ls.l('GeneralSettings'),
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
    constructor(
        private changeDetectorRef: ChangeDetectorRef,
        private dialogRef: MatDialogRef<TenantSettingsWizardComponent>,
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
        this.next();
    }

    stepClick(index: number) {
        this.stepper.selectedIndex = index;
        this.changeDetectorRef.detectChanges();
    }
}