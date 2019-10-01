/** Core imports */
import { ChangeDetectionStrategy, Component, Input, ViewChild } from '@angular/core';

/** Third party imports */
import { DxPivotGridComponent } from 'devextreme-angular/ui/pivot-grid';

/** Application imports */
import { FiltersService } from '@shared/filters/filters.service';

@Component({
    selector: 'slice-pivot-grid',
    templateUrl: 'slice-pivot-grid.component.html',
    styleUrls: [ './slice-pivot-grid.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SlicePivotGridComponent {
    @Input() dataSource: any;
    @Input() storageKey: string;
    @Input() height = 'auto';
    @ViewChild(DxPivotGridComponent) pivotGrid: DxPivotGridComponent;
    summaryDisplayModes: any[] = [
        { text: 'None', value: 'none' },
        { text: 'Absolute Variation', value: 'absoluteVariation' },
        { text: 'Percent Variation', value: 'percentVariation' },
        { text: 'Percent of Column Total', value: 'percentOfColumnTotal' },
        { text: 'Percent of Row Total', value: 'percentOfRowTotal' },
        { text: 'Percent of Column Grand Total', value: 'percentOfColumnGrandTotal' },
        { text: 'Percent of Row Grand Total', value: 'percentOfRowGrandTotal' },
        { text: 'Percent of Grand Total', value: 'percentOfGrandTotal' }
    ];
    constructor(public filtersService: FiltersService) {}

    prepareContextMenu(e) {
        if (e.field && e.field.name === 'count') {
            this.summaryDisplayModes.forEach(mode => {
                e.items.push({
                    text: mode.text,
                    selected: e.field.summaryDisplayMode === mode.value,
                    onItemClick: () => {
                        this.pivotGrid.instance.getDataSource().field(e.field.index, {
                            summaryDisplayMode: mode.value
                        });
                        this.pivotGrid.instance.getDataSource().load();
                    }
                });
            });
        }
    }
}
