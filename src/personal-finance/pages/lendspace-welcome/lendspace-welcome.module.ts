import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

import { DxTextBoxModule } from 'devextreme-angular/ui/text-box';
import { DxValidatorModule } from 'devextreme-angular/ui/validator';
import { DxButtonModule } from 'devextreme-angular/ui/button';
import { NgxMaskModule } from 'ngx-mask';

import { LendspaceWelcomeComponent } from '@root/personal-finance/pages/lendspace-welcome/lendspace-welcome.component';
import { LayoutModule } from '@root/personal-finance/shared/layout/layout.module';
import { RecommendedCardsComponent } from './recommended-cards/recommended-cards.component';
import { RecommendedLendersComponent } from './recommended-lenders/recommended-lenders.component';
import { RecommendedArticlesComponent } from './recommended-articles/recommended-articles.component';
import { FreeCheckingComponent } from './free-checking/free-checking.component';
import { ShopNowComponent } from './shop-now/shop-now.component';
import { StarsRatingModule } from '@shared/common/stars-rating/stars-rating.module';

@NgModule({
    imports: [
        CommonModule,
        LayoutModule,
        DxTextBoxModule,
        DxValidatorModule,
        DxButtonModule,
        FormsModule,
        StarsRatingModule,
        NgxMaskModule.forRoot(),
        RouterModule.forChild([{
            path: '',
            component: LendspaceWelcomeComponent
        }])
    ],
    declarations: [
        LendspaceWelcomeComponent,
        RecommendedCardsComponent,
        RecommendedLendersComponent,
        RecommendedArticlesComponent,
        FreeCheckingComponent,
        ShopNowComponent
    ]
})
export class LendspaceWelcomeModule {}
