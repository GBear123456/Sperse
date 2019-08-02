/** Core imports */
import {
    Component,
    Inject,
    OnInit,
    ViewChild,
    Injector
} from '@angular/core';

/** Third party imports */
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatHorizontalStepper } from '@angular/material';


/** Application imports */
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { InputStatusesService } from '@shared/utils/input-statuses.service';
import { OffersWizardService } from '@shared/offers-wizard/offers-wizard.service';


@Component({
  selector: 'app-wizard-centr-modal',
  templateUrl: './wizard-center-modal.component.html',
  styleUrls: ['./wizard-center-modal.component.less']
})
export class WizardCenterModalComponent implements OnInit {
    @ViewChild('stepper') stepper: MatHorizontalStepper;
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

    ngOnInit() {}

    goToNextStep(event) {
        let result = event.validationGroup.validate();
        if (result.isValid) this.stepper.next();
    }

}
