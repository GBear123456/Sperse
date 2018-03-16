import {AppComponentBase} from '@shared/common/app-component-base';
import {Component, Inject, Injector} from '@angular/core';
import {MatDialogRef, MAT_DIALOG_DATA} from '@angular/material';
import {AppConsts} from '@shared/AppConsts';
import {ResetClassificationDto} from '@shared/service-proxies/service-proxies';

@Component({
    selector: 'app-choose-reset-rules',
    templateUrl: './choose-reset-rules.component.html',
    styleUrls: ['./choose-reset-rules.component.less']
})
export class ChooseResetRulesComponent extends AppComponentBase {
    resetRules = new ResetClassificationDto();
    isEmpty = false;

    constructor(
        injector: Injector,
        public dialogRef: MatDialogRef<ChooseResetRulesComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        super(injector, AppConsts.localization.defaultLocalizationSourceName);
    }

    onSave() {
        if (JSON.stringify(this.resetRules) === JSON.stringify(new ResetClassificationDto())) {
            this.isEmpty = true;
        } else {
            if (this.resetRules.removeCategoryTree) {
                this.resetRules.removeRules = true;
                this.resetRules.removeForecasts = true;
            }
            this.dialogRef.close(this.resetRules);
        }
    }

}
