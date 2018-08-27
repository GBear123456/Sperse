import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CreditReportsCommonModule } from '../../shared/common/credit-reports-common.module';

import { DxCircularGaugeModule, DxBarGaugeModule, DxTabsModule, DxDataGridModule, DxLoadPanelModule, DxTemplateModule, DxChartModule } from 'devextreme-angular';

import { RoundProgressModule } from 'angular-svg-round-progressbar';
import { NgxPageScrollModule } from 'ngx-page-scroll';
import { StickyModule } from 'ng2-sticky-kit/ng2-sticky-kit';

import { CreditReportComponent } from './credit-report.component';
import { CreditHistoryComponent } from './credit-history/credit-history.component';
import { CreditScoresComponent } from './credit-scores/credit-scores.component';
import { CreditSummaryComponent } from './credit-summary/credit-summary.component';
import { PersonalInfoComponent } from './personal-info/personal-info.component';
import { PublicInfoComponent } from './public-info/public-info.component';
import { AccountsComponent } from './accounts/accounts.component';
import { AlertsComponent } from './alerts/alerts.component';
import { RecommendationsComponent } from './recommendations/recommendations.component';
import { InquiriesComponent } from './inquiries/inquiries.component';
import { CreditorContactsComponent } from './creditor-contacts/creditor-contacts.component';
import { ScoreFactorsComponent } from './score-factors/score-factors.component';
import { ConsumerStatementsComponent } from './consumer-statements/consumer-statements.component';
import { KbaComponent } from './kba-request/kba-request.component';

import { LayoutModule } from '../../shared/layout/layout.module';

@NgModule({
    imports: [
        CommonModule,
        DxCircularGaugeModule,
        RoundProgressModule,
        NgxPageScrollModule,
        StickyModule,
        LayoutModule,
        DxBarGaugeModule,
        DxTabsModule,
        DxDataGridModule,
        DxLoadPanelModule,
        DxTemplateModule,
        DxChartModule,
        CreditReportsCommonModule
    ],
    declarations: [
        CreditReportComponent,
        CreditHistoryComponent,
        CreditScoresComponent,
        CreditSummaryComponent,
        PersonalInfoComponent,
        PublicInfoComponent,
        AccountsComponent,
        AlertsComponent,
        RecommendationsComponent,
        InquiriesComponent,
        CreditorContactsComponent,
        ScoreFactorsComponent,
        ConsumerStatementsComponent,
        KbaComponent
    ],
    bootstrap: [
        CreditReportComponent
    ]
})
export class CreditReportModule { }
