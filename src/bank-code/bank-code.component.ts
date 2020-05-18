import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
    selector: 'bank-code',
    templateUrl: 'bank-code.component.html',
    styleUrls: [
        '../account/layouts/bank-code/bank-code-dialog.component.less',
        './bank-code.component.less',
        '../shared/aviano-sans-font.less'
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class BankCodeComponent {
    constructor() {}
}