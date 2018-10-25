import { ChangeDetectionStrategy, Component, Input, Injector, Output, EventEmitter } from '@angular/core';
import { ConditionsType } from '@shared/AppEnums';
import { ConditionsModalComponent } from '@shared/common/conditions-modal/conditions-modal.component';
import { MatDialog } from '@angular/material';
import { AppComponentBase } from '@shared/common/app-component-base';

@Component({
    selector: 'payment-options-footer',
    styleUrls: [ './payment-options-footer.component.less' ],
    templateUrl: './payment-options-footer.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaymentOptionsFooterComponent extends AppComponentBase {
    @Input() submitButtonText: string;
    @Input() submitButtonDisabled = false;
    @Output() onSubmit: EventEmitter<null> = new EventEmitter();

    constructor(
        injector: Injector,
        private dialog: MatDialog
    ) {
        super(injector);
    }

    openTermsModal() {
        this.dialog.open(ConditionsModalComponent, { panelClass: 'slider', data: { type: ConditionsType.Terms } });
    }
}
