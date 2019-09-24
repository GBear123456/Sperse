/** Core imports */
import { NgModule } from '@angular/core';
import * as ngCommon from '@angular/common';

/** Third party imports */
import { DxScrollViewModule } from 'devextreme-angular/ui/scroll-view';

/** Application imports */
import { AppCommonModule } from '../shared/common/app-common.module';
import { CommonModule } from '@shared/common/common.module';
import { HubRoutingModule } from './hub-routing.module';
import { MarketplaceComponent } from './marketplace/marketplace.component';

@NgModule({
    imports: [
        ngCommon.CommonModule,
        HubRoutingModule,
        AppCommonModule,
        CommonModule,
        DxScrollViewModule
    ],
    declarations: [
        MarketplaceComponent
    ]
})
export class HubModule {
}
