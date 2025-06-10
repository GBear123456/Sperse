import { NgModule } from '@angular/core';
import { OrderHistoryComponent } from './order-history.component';
import { OrderHistoryRoutingModule } from './order-history-routing.module';
import { SubscriptionsComponent } from './subscriptions/subscriptions.component';
import { PaymentsComponent } from './payments/payments.component';
import { CommonModule } from '@angular/common';
import { LoadingSpinnerModule } from '../../app/shared/common/loading-spinner/loading-spinner.module';
import { SidebarModule } from '../shared/sidebar/sidebar.module';

@NgModule({
    imports: [
        CommonModule,
        LoadingSpinnerModule,
        SidebarModule,
        OrderHistoryRoutingModule
    ],
    exports: [],
    declarations: [
        SubscriptionsComponent,
        PaymentsComponent,
        OrderHistoryComponent
    ],
    providers: [],
})
export class OrderHistoryModule {}