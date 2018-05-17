import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ClientsComponent } from './clients/clients.component';
import { LeadsComponent } from './leads/leads.component';
import { OrdersComponent } from './orders/orders.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ImportLeadsComponent } from './import-leads/import-leads.component';

@NgModule({
    imports: [
        RouterModule.forChild([
            { path: '', redirectTo: '/app/crm/dashboard', pathMatch: 'full' },
            {
                path: '',
                children: [
                    { path: 'start', component: DashboardComponent, data: { permission: 'Pages.Detect.Route' } },
                    { path: 'dashboard', component: DashboardComponent, data: { permission: '' } },
                    { path: 'clients', component: ClientsComponent, data: { permission: 'Pages.CRM.Customers', reuse: true } },
                    { path: 'leads', component: LeadsComponent, data: { permission: 'Pages.CRM.Leads', reuse: true } },
                    { path: 'orders', component: OrdersComponent, data: { permission: 'Pages.CRM.Orders' } },
                    { path: 'import-leads', component: ImportLeadsComponent, data: { permission: 'Pages.CRM.Leads', reuse: true } }
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
