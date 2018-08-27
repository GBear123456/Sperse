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
import {
    DxSliderModule,
    DxSwitchModule,
    DxRadioGroupModule,
    DxButtonModule,
    DxNumberBoxModule
} from 'devextreme-angular';
import { SimulationGroupComponent } from './simulation-group/simulation-group.component';

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
        RouterModule
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
