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
                canActivate: [],
                canActivateChild: [ ],
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
                        loadChildren: 'bank-code/products/products.module#ProductsModule'
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
                    }
                ]
            }
        ])
    ],
    exports: [ RouterModule ],
    providers: [ RedirectGuard ]
})
export class BankCodeRoutingModule { }
