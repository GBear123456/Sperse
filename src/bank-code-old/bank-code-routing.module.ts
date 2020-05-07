import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { BankCodeComponent } from './bank-code.component';
import { DashboardComponent } from '@root/bank-code/dashboard/dashboard.component';
import { ResourcesComponent } from '@root/bank-code/resources/resources.component';
import { RedirectGuard } from '@shared/common/redirect-guard/redirect-guard';

@NgModule({
    imports: [
        RouterModule.forChild([
            {
                path: '',
                component: BankCodeComponent,
                children: [
                    {
                        path: '',
                        redirectTo: 'home',
                        pathMatch: 'full'
                    },
                    {
                        path: 'home',
                        component: DashboardComponent
                    },
                    {
                        path: 'products',
                        loadChildren: () => import('bank-code/products/products.module').then(m => m.ProductsModule)
                    },
                    {
                        path: 'resources',
                        component: ResourcesComponent
                    },
                    {
                        path: 'events',
                        canActivate: [ RedirectGuard ],
                        component: RedirectGuard,
                        data: {
                            externalUrl: 'https://www.eventbrite.com/o/cheri-tree-14479776861'
                        }
                    },
                    {
                        path: 'order-history',
                        loadChildren: () => import('bank-code/order-history/order-history.module').then(m => m.OrderHistoryModule)
                    }
                ]
            }
        ])
    ],
    exports: [ RouterModule ],
    providers: [ RedirectGuard ]
})
export class BankCodeRoutingModule { }
