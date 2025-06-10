/** Core imports */
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

/** Third party imports */
import { DxPivotGridModule } from 'devextreme-angular/ui/pivot-grid';
import { DxChartModule } from 'devextreme-angular/ui/chart';
import { DxSelectBoxModule } from 'devextreme-angular/ui/select-box';
import { DxVectorMapModule } from 'devextreme-angular/ui/vector-map';

/** Application imports */
import { PivotGridComponent } from '@app/shared/common/slice/pivot-grid/pivot-grid.component';
import { ChartComponent } from '@app/shared/common/slice/chart/chart.component';
import { InfoComponent } from '@app/shared/common/slice/info/info.component';
import { LoadingSpinnerModule } from '@app/shared/common/loading-spinner/loading-spinner.module';

@NgModule({
    imports: [
        CommonModule,
        DxPivotGridModule,
        DxChartModule,
        DxSelectBoxModule,
        DxVectorMapModule,
        LoadingSpinnerModule
    ],
    declarations: [
        PivotGridComponent,
        ChartComponent,
        InfoComponent
    ],
    exports: [
        PivotGridComponent,
        ChartComponent,
        InfoComponent
    ],
    providers: [],
})
export class SliceModule {}
