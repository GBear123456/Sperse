/** Core imports */
import { NgModule } from '@angular/core';
import * as ngCommon from '@angular/common';

/** Third party imports */
import 'chartjs-plugin-labels';
import { ChartModule } from 'angular2-chartjs';
import { DxProgressBarModule } from 'devextreme-angular/ui/progress-bar';
import { NgCircleProgressModule } from 'ng-circle-progress';

/** Application imports  */
import { TotalCodesCrackedComponent } from '@root/bank-code/shared/common/total-codes-cracked/total-codes-cracked.component';
import { GoalsCrackedComponent } from '@root/bank-code/shared/common/goals-cracked/goals-cracked.component';
import { CountersComponent } from '@root/bank-code/shared/common/counters/counters.component';
import { GlanceComponent } from '@root/bank-code/shared/common/glance/glance.component';
import { CounterComponent } from "@root/bank-code/shared/common/counters/counter/counter.component";

@NgModule({
    imports: [
        ngCommon.CommonModule,
        DxProgressBarModule,
        ChartModule,
        NgCircleProgressModule.forRoot({
            // defaults config
            radius: 40,
            space: -7,
            outerStrokeGradient: false,
            outerStrokeWidth: 7,
            innerStrokeWidth: 7,
            showUnits: false,
            showBackground: false,
            titleFontSize: '18',
            subtitleFontSize: '12.3',
            titleFontWeight: '700',
            subtitleFontWeight: '700',
            startFromZero: false,
            animation: false,
            animateTitle: false,
            animationDuration: 0
        })
    ],
    exports: [
        TotalCodesCrackedComponent,
        GoalsCrackedComponent,
        CounterComponent,
        CountersComponent,
        GlanceComponent
    ],
    declarations: [
        TotalCodesCrackedComponent,
        GoalsCrackedComponent,
        CounterComponent,
        CountersComponent,
        GlanceComponent
    ],
    providers: [],
})
export class CommonModule {}
