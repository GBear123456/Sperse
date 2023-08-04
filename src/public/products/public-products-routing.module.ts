import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LocalizationResolver } from '@shared/common/localization-resolver';
import { SingleProductComponent } from './single-product/single-product.component';

@NgModule({
    imports: [
        RouterModule.forChild([
            {
                path: ':tenantId/:productPublicName',
                component: SingleProductComponent,
                canActivate: [LocalizationResolver],
                canActivateChild: [],
                data: { localizationSource: 'CRM' }
            }
        ])
    ],
    exports: [RouterModule],
    providers: []
})
export class PublicProductsRoutingModule { }
