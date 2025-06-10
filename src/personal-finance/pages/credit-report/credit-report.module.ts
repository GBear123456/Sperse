/** Core imports */
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

/** Third party imports */
import { RoundProgressModule } from 'angular-svg-round-progressbar';
import { DxCircularGaugeModule } from 'devextreme-angular/ui/circular-gauge';
import { DxBarGaugeModule } from 'devextreme-angular/ui/bar-gauge';
import { DxTabsModule } from 'devextreme-angular/ui/tabs';
import { DxDataGridModule } from 'devextreme-angular/ui/data-grid';
import { DxLoadPanelModule } from 'devextreme-angular/ui/load-panel';
import { DxTemplateModule } from 'devextreme-angular/core';
import { DxChartModule } from 'devextreme-angular/ui/chart';
import { DxSelectBoxModule } from 'devextreme-angular/ui/select-box';
import { NgxPageScrollModule } from 'ngx-page-scroll';

/** Application imports */
import { PersonalFinanceCommonModule } from '../../shared/common/personal-finance-common.module';
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
import { CreditReportServiceProxy } from '@shared/service-proxies/service-proxies';
import { DateTimeModule } from '@shared/common/pipes/datetime/datetime.module';

@NgModule({
    imports: [
        CommonModule,
        DxCircularGaugeModule,
        RoundProgressModule,
        NgxPageScrollModule,
        LayoutModule,
        DxBarGaugeModule,
        DxTabsModule,
        DxDataGridModule,
        DxLoadPanelModule,
        DxTemplateModule,
        DxChartModule,
        DxSelectBoxModule,
        PersonalFinanceCommonModule,
        RouterModule.forChild([{
            path: '',
            component: CreditReportComponent
        }]),
        DateTimeModule
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
    providers: [
        CreditReportServiceProxy
    ]
})
export class CreditReportModule { }
