/** Core imports */
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    HostBinding,
    Input,
    OnInit,
    ViewChild
} from '@angular/core';

/** Third party imports */
import { BehaviorSubject, Observable } from 'rxjs';
import { delay, filter, first } from 'rxjs/operators';
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
export class PivotGridComponent implements OnInit {
    @Input() dataSource: any;
    @Input() storageKey: string;
    @Input() isLoading = true;
    @Input() height: number | string = 'auto';
    @HostBinding('style.height')
    public get  componentHeight(): string {
        return this.height + 'px';
    }
    @ViewChild(DxPivotGridComponent, { static: false }) pivotGrid: DxPivotGridComponent;
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
    private contentShown: BehaviorSubject<boolean> = new BehaviorSubject(false);
    contentShown$: Observable<boolean> = this.contentShown.asObservable();

    constructor(
        private changeDetectorRef: ChangeDetectorRef,
        public filtersService: FiltersService
    ) {}

    ngOnInit() {
        this.contentShown$.pipe(
            filter(Boolean),
            first(),
            delay(0)
        ).subscribe(() => {
            this.pivotGrid.instance.repaint();
        });
    }

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

    onContentReady() {
        this.contentShown.next(this.isLoading !== undefined);
        this.updateTotalCellsSizes();
    }

    updateTotalCellsSizes() {
        setTimeout(() => {
            this.pivotGrid.instance.element().querySelectorAll('.dx-scrollable-content > table tbody tr:last-of-type .dx-grandtotal').forEach((grandTotalCell: HTMLTableCellElement) => {
                if (grandTotalCell.parentElement.previousSibling &&
                    (grandTotalCell.parentElement.style.position === 'fixed'
                        || grandTotalCell.getBoundingClientRect().bottom > window.innerHeight)
                ) {
                    grandTotalCell.parentElement.style.position = 'fixed';
                    grandTotalCell.parentElement.style.bottom = '0';
                    /** Get width and height of cell from previous row */
                    const cellIndex = grandTotalCell.cellIndex;
                    const sameElementFromPrevRow = grandTotalCell.parentElement.previousSibling['children'][cellIndex];
                    grandTotalCell.style.width = (sameElementFromPrevRow.getBoundingClientRect().width - 20) + 'px';
                    if (!grandTotalCell.closest('.dx-pivotgrid-vertical-headers')) {
                        grandTotalCell.style.height = grandTotalCell.parentElement.clientHeight + 'px';
                    }
                }
            });
        });
    }

    toggleFieldPanel() {
        this.showFieldPanel = !this.showFieldPanel;
        this.changeDetectorRef.detectChanges();
    }
}
