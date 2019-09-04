/** Core imports */
import {
    Component,
    Inject,
    ViewChild,
    Injector
} from '@angular/core';

/** Third party imports */
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatHorizontalStepper } from '@angular/material';
import { DxValidationGroupComponent } from 'devextreme-angular/ui/validation-group';

/** Application imports */
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { InputStatusesService } from '@shared/utils/input-statuses.service';
import { OffersWizardService } from '@shared/offers-wizard/offers-wizard.service';

@Component({
  selector: 'app-wizard-centr-modal',
  templateUrl: './wizard-center-modal.component.html',
  styleUrls: ['./wizard-center-modal.component.less']
})
export class WizardCenterModalComponent {
    @ViewChild('stepper') stepper: MatHorizontalStepper;
    @ViewChild('lastValidationGroup') lastValidationGroup: DxValidationGroupComponent;
    dialogRef: MatDialogRef<WizardCenterModalComponent, any>;
    constructor(
        injector: Injector,
        public ls: AppLocalizationService,
        public inputStatusesService: InputStatusesService,
        public offersWizardService: OffersWizardService,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        this.offersWizardService.data = data;
        this.offersWizardService.dialogRef = this.dialogRef = <any>injector.get(MatDialogRef);
    }

    goToNextStep(event) {
        if (this.isValid(event)) {
            this.stepper.next();
        }
    }

    private isValid(event): boolean {
        let result = event.validationGroup && event.validationGroup.validate();
        return !result || result.isValid;
    }

    submit(event) {
        if (this.isValid(event)) {
            this.offersWizardService.checkIfEmailChanged();
        }
    }

    get submitButtonIsDisabled() {
        return this.lastValidationGroup && !this.lastValidationGroup.instance.validate().isValid;
    }
}
