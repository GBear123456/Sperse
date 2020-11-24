/** Core imports */
import { Component, Inject, Injector } from '@angular/core';

/** Third party imports */
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

/** Application imports */
import { AppComponentBase } from '@shared/common/app-component-base';
import { GenerateApiKeyInput } from '@shared/service-proxies/service-proxies';
import { DateHelper } from '@shared/helpers/DateHelper';

@Component({
    templateUrl: 'add-key-dialog.component.html',
    styleUrls: ['add-key-dialog.component.less']
})
export class EditKeyDialog extends AppComponentBase {
    isValid = false;
    validator: any;
    minCalendarDate = DateHelper.addTimezoneOffset(new Date(), true);
    maxCalendarDate = new Date(2038, 0, 19);
    model: GenerateApiKeyInput = new GenerateApiKeyInput({
        name: '',
        expirationDate: this.minCalendarDate
    });

    private readonly ONE_HOUR_MILISECONDS = 3600000;

    constructor(injector: Injector,
        @Inject(MAT_DIALOG_DATA) public data: any,
        public dialogRef: MatDialogRef<EditKeyDialog>
    ) {
        super(injector);
        this.model.expirationDate.setTime(this.minCalendarDate.getTime() + this.ONE_HOUR_MILISECONDS);
    }

    onSave(event) {
        if (this.validator.validate().isValid) {
            this.model.expirationDate = DateHelper.removeTimezoneOffset(this.model.expirationDate, true);
            this.dialogRef.close(this.model);
        }
    }

    initValidationGroup(event) {
        this.validator = event.component;
    }
}
