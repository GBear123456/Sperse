/** Core imports */
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

/** Third party imports */
import { MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { RoundProgressModule } from 'angular-svg-round-progressbar';
import { MatSliderModule } from '@angular/material/slider';

/** Application imports */
import { OffersLayoutComponent } from '@root/personal-finance/shared/offers/offers-layout.component';
import { LayoutModule } from '../layout/layout.module';
import { DxScrollViewModule } from '@root/node_modules/devextreme-angular';
import { OfferDetailsComponent } from '@root/personal-finance/shared/offers/offer-details/offer-details.component';
import { NoDataModule } from '@shared/common/widgets/no-data/no-data.module';
import { OffersRoutingModule } from '@root/personal-finance/shared/offers/offers-routing.module';
import { NumberAbbrPipe } from '@shared/common/pipes/number-abbr/number-abbr.pipe';
import { CreditCardsComponent } from './credit-cards/credit-cards.component';
import { CreditScoreComponent } from '@root/personal-finance/shared/offers/credit-score/credit-score.component';
import { NavigationComponent } from '@root/personal-finance/shared/offers/navigation/navigation.component';
import { CreditMonitoringComponent } from '@root/personal-finance/shared/offers/credit-monitoring/credit-monitoring.component';
import { ChooserFilterComponent } from '@root/personal-finance/shared/offers/filters/chooser-filter/chooser-filter.component';
import { ScoreFilterComponent } from '@root/personal-finance/shared/offers/filters/score-filter/score-filter.component';
import { BusinessLoansComponent } from '@root/personal-finance/shared/offers/business-loans/business-loans.component';
import { OffersCategoryDetailsComponent } from '@root/personal-finance/shared/offers/offers-category-details/offers-category-details.component';
import { DebtConsolidationComponent } from '@root/personal-finance/shared/offers/debt-consolidation/debt-consolidation.component';
import { PersonalFinanceCommonModule } from '../../shared/common/personal-finance-common.module';
import { StarsRatingModule } from '@shared/common/stars-rating/stars-rating.module';

@NgModule({
    imports: [
        FormsModule,
        CommonModule,
        MatSelectModule,
        MatDialogModule,
        MatRadioModule,
        MatCheckboxModule,
        MatSliderModule,
        MatSelectModule,
        DxScrollViewModule,
        RoundProgressModule,
        NoDataModule,
        OffersRoutingModule,
        StarsRatingModule,
        LayoutModule,
        PersonalFinanceCommonModule
    ],
    declarations: [
        OffersLayoutComponent,
        OfferDetailsComponent,
        NumberAbbrPipe,
        CreditCardsComponent,
        CreditScoreComponent,
        NavigationComponent,
        CreditMonitoringComponent,
        ChooserFilterComponent,
        ScoreFilterComponent,
        BusinessLoansComponent,
        OffersCategoryDetailsComponent,
        DebtConsolidationComponent
    ]
})
export class OffersModule {}
