/** Core imports */
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

/** Third party imports */
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';

/** Application imports */
import { ProductsService } from '@root/bank-code/products/products.service';
import { WhyTheyBuyHostComponent } from './why-they-buy-host.component';
import { WhyTheyBuyHostRoutingModule } from './why-they-buy-host-routing.module';
import { LoadingSpinnerModule } from '@app/shared/common/loading-spinner/loading-spinner.module';

@NgModule({
    imports: [
        CommonModule,
        WhyTheyBuyHostRoutingModule,
        LoadingSpinnerModule,
        NgxExtendedPdfViewerModule
    ],
    exports: [],
    declarations: [ WhyTheyBuyHostComponent ],
    providers: [
        ProductsService
    ]
})
export class WhyTheyBuyHostModule {}
