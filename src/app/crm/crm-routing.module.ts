import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ClientsComponent } from './clients/clients.component';
import { LeadsComponent } from './leads/leads.component';
import { OrdersComponent } from './orders/orders.component';
import { TenantsComponent } from './tenants/tenants.component';
import { EditionsComponent } from './editions/editions.component';

@NgModule({
    imports: [
        RouterModule.forChild([
            { path: '', redirectTo: '/app/crm/clients', pathMatch: 'full' },
            {
                path: '',
                children: [
                    { path: 'clients', component: ClientsComponent, data: { permission: 'Pages.CRM.Customers' } },
                    { path: 'leads', component: LeadsComponent, data: { permission: 'Pages.CRM.Leads' } },
                    { path: 'orders', component: OrdersComponent, data: { permission: 'Pages.CRM.Orders' } },
                    { path: 'editions', component: EditionsComponent, data: { permission: 'Pages.Editions' } },
                    { path: 'tenants', component: TenantsComponent, data: { permission: 'Pages.Tenants' } }
                ]
            }
        ])
    ],
    exports: [
        RouterModule
    ]
})
export class CrmRoutingModule {
  constructor() { }
}
