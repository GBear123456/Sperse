import { Component } from '@angular/core';
import { ConditionsModalComponent } from '@shared/common/conditions-modal/conditions-modal.component';
import { MatDialog } from '@angular/material';
import { ConditionsType } from '@shared/AppEnums';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    selector: 'bank-code-footer',
    templateUrl: './footer.component.html',
    styleUrls: ['./footer.component.less']
})
export class FooterComponent {
    conditions = ConditionsType;
    currentYear = new Date().getFullYear();

    constructor(
        private dialog: MatDialog,
        public ls: AppLocalizationService
    ) {}

    openConditionsDialog(type: any) {
        this.dialog.open(ConditionsModalComponent, {panelClass: ['slider', 'footer-slider'], data: {type: type}});
    }

}
