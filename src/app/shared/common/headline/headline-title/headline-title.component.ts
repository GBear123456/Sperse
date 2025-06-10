/** Core imports */
import {
    ChangeDetectionStrategy,
    Component,
    Injector,
    Input
} from '@angular/core';

/** Third party imports */

/** Application imports */

@Component({
    selector: 'app-headline-title',
    templateUrl: './headline-title.component.html',
    styleUrls: ['./headline-title.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeadLineTitleComponent {
    @Input() names: string[];
    @Input() icon: string;
    @Input() iconSrc: string;
    @Input() text: string;       
    @Input() totalCount: number;
    @Input() totalErrorMsg: string = '';
    @Input() showTotalCount: Boolean;

    constructor(
        injector: Injector,
    ) {}

    isTotalCountValid() {
        return Number.isInteger(this.totalCount);
    }
}