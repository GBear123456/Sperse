import {NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';

import {MemberAreaRoutingModule} from './member-area-routing.module';
import {MemberAreaComponent} from './member-area.component';
import {CreditReportModule} from './credit-report/credit-report.module';
import {CreditSimulatorModule} from './credit-simulator/credit-simulator.module';
import {CreditResourcesModule} from './credit-resources/credit-resources.module';

import * as _ from 'underscore';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        CreditReportModule,
        MemberAreaRoutingModule,
        CreditSimulatorModule,
        CreditResourcesModule
    ],
    declarations: [
        MemberAreaComponent
    ]
})
export class MemberAreaModule {
}
