import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SubscriptionsComponent } from './subscriptions/subscriptions.component';
import { PaymentsComponent } from './payments/payments.component';
import { OrderHistoryComponent } from './order-history.component';

@NgModule({
    imports: [
        RouterModule.forChild([
            {
                path: '',
                component: OrderHistoryComponent,
                children: [
                    {
                        path: 'subscriptions',
                        component: SubscriptionsComponent
                    },
                    {
                        path: 'payments',
                        component: PaymentsComponent
                    }
                ]
            }
        ])
    ],
    exports: [
        RouterModule
    ]
})
export class OrderHistoryRoutingModule {}