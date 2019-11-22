/** Core imports */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewChild } from '@angular/core';

/** Third party imports */
import { DxPivotGridComponent } from 'devextreme-angular/ui/pivot-grid';

/** Application imports */
import { FiltersService } from '@shared/filters/filters.service';

@Component({
    selector: 'slice-pivot-grid',
    templateUrl: 'pivot-grid.component.html',
    styleUrls: [
        '../../../../../shared/common/styles/close-button.less',
        './pivot-grid.component.less'
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PivotGridComponent {
    @Input() dataSource: any;
    @Input() storageKey: string;
    @Input() height = 'auto';
    @Input() isLoading = true;
    @ViewChild(DxPivotGridComponent) pivotGrid: DxPivotGridComponent;
    showFieldPanel = false;
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
    constructor(
        private changeDetectorRef: ChangeDetectorRef,
        public filtersService: FiltersService
    ) {}

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

    onContentReady(e) {
        e.element.querySelectorAll('.dx-scrollable-content > table tbody tr:last-of-type .dx-grandtotal').forEach(grandTotalCell => {
            if (grandTotalCell.parentElement.previousSibling &&
                (grandTotalCell.parentElement.style.position === 'fixed'
                 || grandTotalCell.getBoundingClientRect().bottom > window.innerHeight
                )
            ) {
                grandTotalCell.parentElement.style.position = 'fixed';
                grandTotalCell.parentElement.style.bottom = '0';
                /** Get width and height of cell from previous row */
                const cellIndex = grandTotalCell.cellIndex;
                const sameElementFromPrevRow = grandTotalCell.parentElement.previousSibling.children[cellIndex];
                grandTotalCell.style.width = (sameElementFromPrevRow.clientWidth - 20) + 'px';
                if (!grandTotalCell.closest('.dx-pivotgrid-vertical-headers')) {
                    grandTotalCell.style.height = grandTotalCell.parentElement.clientHeight + 'px';
                }
            }
        });
    }

    toggleFieldPanel() {
        this.showFieldPanel = !this.showFieldPanel;
        this.changeDetectorRef.detectChanges();
    }
}
