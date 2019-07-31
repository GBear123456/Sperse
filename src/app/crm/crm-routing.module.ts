import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ClientsComponent } from './clients/clients.component';
import { PartnersComponent } from './partners/partners.component';
import { LeadsComponent } from './leads/leads.component';
import { OrdersComponent } from './orders/orders.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ImportLeadsComponent } from './import-leads/import-leads.component';
import { ImportListComponent } from './import-leads/import-list.component';
import { ActivityComponent } from './activity/activity.component';
import { AppPermissions } from '@shared/AppPermissions';

@NgModule({
    imports: [
        RouterModule.forChild([
            { path: '', redirectTo: '/app/crm/dashboard', pathMatch: 'full' },
            {
                path: '',
                children: [
                    { path: 'dashboard', component: DashboardComponent, data: { permission: AppPermissions.PagesCRM, reuse: true } },
                    { path: 'clients', component: ClientsComponent, data: { permission: 'Pages.CRM.Customers', reuse: true } },
                    { path: 'partners', component: PartnersComponent, data: { permission: AppPermissions.PagesCRMPartners, reuse: true } },
                    { path: 'leads', component: LeadsComponent, data: { permission: 'Pages.CRM.Customers', reuse: true } },
                    { path: 'orders', component: OrdersComponent, data: { permission: 'Pages.CRM.Orders', reuse: true } },
                    { path: 'import-leads', component: ImportLeadsComponent, data: { permission: AppPermissions.PagesCRMBulkImport, reuse: true } },
                    { path: 'import-list', component: ImportListComponent, data: { permission: AppPermissions.PagesCRMBulkImport, reuse: true } },
                    { path: 'activity', component: ActivityComponent, data: { permission: 'Pages.CRM.Events', reuse: true } }
                ]
            }
        ])
    ],
    exports: [
        RouterModule
    ]
})
export class CrmRoutingModule { }
