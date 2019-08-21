/** Core imports */
import { Component, Injector, Input, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';

/** Third party imports */

/** Application imports */
import { AppComponentBase } from '@root/shared/common/app-component-base';

@Component({
    templateUrl: './setup-steps.component.html',
    styleUrls: ['./setup-steps.component.less'],
    selector: 'setup-steps-common',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SetupStepsComponent extends AppComponentBase {
    @Input() SelectedStepIndex: number;
    @Input() SetupSteps = [
        //{ caption: 'Test', img: 'frog', isDisabled: true, onClick: this.onMenuClick.bind(this) }
    ];
    @Input() HeaderTitle: string;
    @Input() headerLink;

    constructor(
        injector: Injector,
        private _changeDetectorRef: ChangeDetectorRef
    ) {
        super(injector);
    }

    setSelectedIndex(index: number) {
        this.SelectedStepIndex = index;
        this._changeDetectorRef.detectChanges();
    }

    onClick(elem) {
        if (!elem.isDisabled) {
            if (elem.onClick) {
                this.SelectedStepIndex = this.SetupSteps.findIndex(step => step === elem);
                elem.onClick(elem);
                this._changeDetectorRef.detectChanges();
            }
        }
    }
}
