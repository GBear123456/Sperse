/** Core imports */
import { ChangeDetectionStrategy, Component, Input, ViewChild } from '@angular/core';

/** Third party imports */
import { DxPivotGridComponent } from 'devextreme-angular/ui/pivot-grid';

/** Application imports */

@Component({
    selector: 'slice',
    templateUrl: 'slice.component.html',
    styleUrls: [ './slice.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})

export class SliceComponent {
    @Input() dataSource: any;
    @Input() storageKey: string;
    @Input() height = 'auto';
    @ViewChild(DxPivotGridComponent) pivotGrid: DxPivotGridComponent;
    constructor() {}
}
