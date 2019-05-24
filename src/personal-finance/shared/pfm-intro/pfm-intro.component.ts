/** Core imports */
import { ChangeDetectionStrategy, Component, Inject, ViewChild } from '@angular/core';

/** Third party imports */
import { MatHorizontalStepper } from '@angular/material/stepper';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import kebabCase from 'lodash/kebabCase';

/** Application imports */
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    selector: 'app-pfm-intro',
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './pfm-intro.component.html',
    styleUrls: ['./pfm-intro.component.less'],
    animations: [ appModuleAnimation() ]
})
export class PfmIntroComponent {
    @ViewChild('stepper') stepper: MatHorizontalStepper;
    readonly bankNames: string[] = [
        'PNC',
        'Fidelity',
        'Wells Fargo',
        'Bank of America',
        'UCBank',
        'Ameritrade',
        'Vanguard',
        'Chase',
        'Citibank',
        'Navy Federal'
    ];

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: any,
        public ls: AppLocalizationService,
        private dialogRef: MatDialogRef<PfmIntroComponent>
    ) {}

    getBankLogoName(bankName: string): string {
        return kebabCase(bankName);
    }

    closeDialog(addAccount?: boolean) {
        this.dialogRef.close(addAccount);
    }

    onNext() {
        this.closeDialog(true);
    }

}
