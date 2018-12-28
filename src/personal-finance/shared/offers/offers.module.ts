import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { OffersComponent } from '@root/personal-finance/shared/offers/offers.component';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { StarsRatingComponent } from '@root/personal-finance/shared/offers/stars-rating/stars-rating.component';
import { DxScrollViewModule } from '@root/node_modules/devextreme-angular';
import { OfferDetailsComponent } from '@root/personal-finance/shared/offers/offer-details/offer-details.component';
import { RoundProgressModule } from 'angular-svg-round-progressbar';
import { OffersService } from '@root/personal-finance/shared/offers/offers.service';
import { OfferServiceProxy } from '@shared/service-proxies/service-proxies';
import { NoDataModule } from '@shared/common/widgets/no-data/no-data.module';
import { OffersRoutingModule } from '@root/personal-finance/shared/offers/offers-routing.module';
import { MatDialogModule, MatSliderModule } from '@angular/material';
import { NumberAbbrPipe } from '@shared/common/pipes/number-abbr/number-abbr.pipe';
import { ApplyOfferDialogComponent } from '@root/personal-finance/shared/offers/apply-offer-modal/apply-offer-dialog.component';
import { CreditCardsComponent } from './credit-cards/credit-cards.component';

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
        OffersRoutingModule
    ],
    declarations: [
        ApplyOfferDialogComponent,
        StarsRatingComponent,
        OffersComponent,
        OfferDetailsComponent,
        NumberAbbrPipe,
        CreditCardsComponent
    ],
    providers: [
        OffersService,
        OfferServiceProxy
    ],
    entryComponents: [
        ApplyOfferDialogComponent
    ]
})
export class OffersModule {
}
