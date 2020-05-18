import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
    selector: 'complete',
    templateUrl: 'complete.component.html',
    styleUrls: ['complete.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CompleteComponent {
    constructor() {}
}