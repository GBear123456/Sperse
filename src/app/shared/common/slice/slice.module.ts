/** Core imports */
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

/** Third party imports */
import { DxPivotGridModule } from 'devextreme-angular/ui/pivot-grid';
import { DxChartModule } from 'devextreme-angular/ui/chart';
import { DxSelectBoxModule } from 'devextreme-angular/ui/select-box';

/** Application imports */
import { SlicePivotGridComponent } from '@app/shared/common/slice/pivot-grid/slice-pivot-grid.component';
import { SliceChartComponent } from '@app/shared/common/slice/chart/slice-chart.component';
import { SliceInfoComponent } from '@app/shared/common/slice/info/slice-info.component';

@NgModule({
    imports: [
        CommonModule,
        DxPivotGridModule,
        DxChartModule,
        DxSelectBoxModule
    ],
    declarations: [
        SlicePivotGridComponent,
        SliceChartComponent,
        SliceInfoComponent
    ],
    exports: [
        SlicePivotGridComponent,
        SliceChartComponent,
        SliceInfoComponent
    ],
    providers: [],
})
export class SliceModule {}
