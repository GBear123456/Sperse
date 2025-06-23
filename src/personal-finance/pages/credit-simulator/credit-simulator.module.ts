import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PersonalFinanceCommonModule } from '../../shared/common/personal-finance-common.module';
import { CreditSimulatorComponent } from './credit-simulator.component';
import { LayoutModule } from '../../shared/layout/layout.module';
import { RoundProgressModule } from 'angular-svg-round-progressbar';
import { HistoryLogComponent } from './history-log/history-log.component';
import { ScorePreviewComponent } from './score-preview/score-preview.component';
import { RouterModule } from '@angular/router';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DxSliderModule } from 'devextreme-angular/ui/slider';
import { DxSwitchModule } from 'devextreme-angular/ui/switch';
import { DxRadioGroupModule } from 'devextreme-angular/ui/radio-group';
import { DxButtonModule } from 'devextreme-angular/ui/button';
import { DxNumberBoxModule } from 'devextreme-angular/ui/number-box';
import { SimulationGroupComponent } from './simulation-group/simulation-group.component';
import { DxSelectBoxModule } from 'devextreme-angular';

@NgModule({
    imports: [
        CommonModule,
        LayoutModule,
        PersonalFinanceCommonModule,
        FormsModule,
        ReactiveFormsModule,
        RoundProgressModule,
        DxSliderModule,
        DxButtonModule,
        DxSwitchModule,
        DxRadioGroupModule,
        DxNumberBoxModule,
        DxSelectBoxModule,
        RouterModule.forChild([{
            path: '',
            component: CreditSimulatorComponent
        }])
    ],
    declarations: [
        CreditSimulatorComponent,
        HistoryLogComponent,
        ScorePreviewComponent,
        SimulationGroupComponent
    ]
})
export class CreditSimulatorModule {
}
