/** Core imports */
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

/** Application imports */
import { ClientsComponent } from './clients/clients.component';
import { ProductsComponent } from './products/products.component';
import { PartnersComponent } from './partners/partners.component';
import { LeadsComponent } from './leads/leads.component';
import { OrdersComponent } from './orders/orders.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { DocumentsComponent } from './documents/documents.component';
import { ImportLeadsComponent } from './import-leads/import-leads.component';
import { ImportListComponent } from './import-leads/import-list/import-list.component';
import { ActivityComponent } from './activity/activity.component';
import { AppPermissions } from '@shared/AppPermissions';
import { ReportsComponent } from '@app/crm/reports/reports.component';
import { CommissionHistoryComponent } from './commission-history/commission-history.component';
import { AppFeatures } from '@shared/AppFeatures';

@NgModule({
    imports: [
        RouterModule.forChild([
            { path: '', redirectTo: '/app/crm/dashboard', pathMatch: 'full' },
            {
                path: '',
                children: [
                    { path: 'dashboard', component: DashboardComponent, data: { permission: AppPermissions.CRM, reuse: true } },
                    { path: 'documents', component: DocumentsComponent, data: { permission: AppPermissions.CRMFileStorageTemplates, reuse: true } },
                    { path: 'clients', component: ClientsComponent, data: { permission: AppPermissions.CRMCustomers, reuse: true } },
                    { path: 'products', component: ProductsComponent, data: { permission: AppPermissions.CRMProducts, reuse: true } },
                    { path: 'partners', component: PartnersComponent, data: { permission: AppPermissions.CRMPartners, reuse: true } },
                    { path: 'leads', component: LeadsComponent, data: { permission: AppPermissions.CRMCustomers, reuse: true } },
                    { path: 'orders', component: OrdersComponent, data: { permission: AppPermissions.CRMOrders, reuse: true } },
                    { path: 'import-leads', component: ImportLeadsComponent, data: { permission: AppPermissions.CRMBulkImport, reuse: true } },
                    { path: 'import-list', component: ImportListComponent, data: { permission: AppPermissions.CRMBulkImport, reuse: true } },
                    { path: 'activity', component: ActivityComponent, data: { permission: AppPermissions.CRM, reuse: true } },
                    { path: 'reports', component: ReportsComponent, data: { permission: AppPermissions.CRM, reuse: true } },
                    { 
                        path: 'commission-history', 
                        component: CommissionHistoryComponent, 
                        data: { 
                            feature: AppFeatures.CRMCommissions, 
                            permission: AppPermissions.CRMAffiliatesCommissions, 
                            reuse: true 
                        } 
                    }
                ]
            }
        ])
    ],
    exports: [
        RouterModule
    ]
})
export class CrmRoutingModule { }