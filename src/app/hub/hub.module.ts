/** Core imports */
import { NgModule } from '@angular/core';
import * as ngCommon from '@angular/common';

/** Third party imports */
import { DxScrollViewModule } from 'devextreme-angular/ui/scroll-view';
import { RatingModule } from 'ng-starrating';

/** Application imports */
import { AppCommonModule } from '@app/shared/common/app-common.module';
import { CommonModule } from '@shared/common/common.module';
import { HubRoutingModule } from './hub-routing.module';
import { MarketplaceComponent } from './marketplace/marketplace.component';
import { LeftMenuService } from '@app/cfo/shared/common/left-menu/left-menu.service';

@NgModule({
    imports: [
        ngCommon.CommonModule,
        HubRoutingModule,
        AppCommonModule,
        CommonModule,
        DxScrollViewModule,
        RatingModule
    ],
    declarations: [
        MarketplaceComponent
    ],
    providers: [
        LeftMenuService
    ]
})
export class HubModule {
}
