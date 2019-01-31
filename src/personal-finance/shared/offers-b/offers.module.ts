/** Core imports */
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

/** Third party imports */
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { RoundProgressModule } from 'angular-svg-round-progressbar';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSliderModule } from '@angular/material/slider';

/** Application imports */
import { OffersLayoutComponent } from '@root/personal-finance/shared/offers-b/offers-layout.component';
import { LayoutModule } from '../layout/layout.module';
import { StarsRatingComponent } from '@root/personal-finance/shared/offers-b/stars-rating/stars-rating.component';
import { DxScrollViewModule } from '@root/node_modules/devextreme-angular';
import { OfferDetailsComponent } from '@root/personal-finance/shared/offers-b/offer-details/offer-details.component';
import { OffersService } from '@root/personal-finance/shared/offers-b/offers.service';
import { OfferServiceProxy } from '@shared/service-proxies/service-proxies';
import { NoDataModule } from '@shared/common/widgets/no-data/no-data.module';
import { OffersRoutingModule } from '@root/personal-finance/shared/offers-b/offers-routing.module';

import { ApplyOfferDialogComponent } from '@root/personal-finance/shared/offers-b/apply-offer-modal/apply-offer-dialog.component';
import { CreditCardsComponent } from './credit-cards/credit-cards.component';
import { CreditScoreComponent } from '@root/personal-finance/shared/offers-b/credit-score/credit-score.component';
import { NavigationComponent } from '@root/personal-finance/shared/offers-b/navigation/navigation.component';
import { CreditMonitoringComponent } from '@root/personal-finance/shared/offers-b/credit-monitoring/credit-monitoring.component';
import { ChooserFilterComponent } from '@root/personal-finance/shared/offers-b/filters/chooser-filter/chooser-filter.component';
import { ScoreFilterComponent } from '@root/personal-finance/shared/offers-b/filters/score-filter/score-filter.component';
import { BusinessLoansComponent } from '@root/personal-finance/shared/offers-b/business-loans/business-loans.component';
import { OffersCategoryDetailsComponent } from '@root/personal-finance/shared/offers-b/offers-category-details/offers-category-details.component';
import { DebtConsolidationComponent } from '@root/personal-finance/shared/offers-b/debt-consolidation/debt-consolidation.component';

@NgModule({
    imports: [
        FormsModule,
        CommonModule,
        MatSelectModule,
        MatRadioModule,
        MatCheckboxModule,
        MatSliderModule,
        MatSelectModule,
        MatDialogModule,
        DxScrollViewModule,
        RoundProgressModule,
        NoDataModule,
        OffersRoutingModule,
        LayoutModule
    ],
    declarations: [
        ApplyOfferDialogComponent,
        StarsRatingComponent,
        OffersLayoutComponent,
        OfferDetailsComponent,
        CreditCardsComponent,
        CreditScoreComponent,
        NavigationComponent,
        CreditMonitoringComponent,
        ChooserFilterComponent,
        ScoreFilterComponent,
        BusinessLoansComponent,
        OffersCategoryDetailsComponent,
        DebtConsolidationComponent
    ],
    providers: [
        OffersService,
        OfferServiceProxy
    ],
    entryComponents: [
        ApplyOfferDialogComponent
    ]
})
export class OffersModuleB {
}
