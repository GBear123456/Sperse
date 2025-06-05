/** Core imports */
import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";

/** Application imports */
import { ClientsComponent } from "./clients/clients.component";
import { ProductsComponent } from "./products/products.component";
import { CouponsComponent } from "./coupons/coupons.component";
import { PartnersComponent } from "./partners/partners.component";
import { LeadsComponent } from "./leads/leads.component";
import { OrdersComponent } from "./orders/orders.component";
import { WelcomeComponent } from "./welcome/welcome.component";
import { ShortcutsComponent } from "./shortcuts/shortcuts.component";
import { DashboardComponent } from "./dashboard/dashboard.component";
import { DocumentsComponent } from "./documents/documents.component";
import { ImportLeadsComponent } from "./import-leads/import-leads.component";
import { ImportListComponent } from "./import-leads/import-list/import-list.component";
import { ActivityComponent } from "./activity/activity.component";
import { LeadConversionJourneyComponent } from "./traffic-stats/lead-conversion-journey/lead-conversion-journey.component";
import { AppPermissions } from "@shared/AppPermissions";
import { ReportsComponent } from "@app/crm/reports/reports.component";
import { CommissionHistoryComponent } from "./commission-history/commission-history.component";
import { TenantReportsComponent } from "./tenant-reports/tenant-reports.component";
import { AppFeatures } from "@shared/AppFeatures";
import { CrmContactGroupGuard } from "@app/crm/crm-contact-group-guard";
import { InvoicesComponent } from "./invoices/invoices.component";
import { ZapierComponent } from "@shared/common/zapier/zapier.component";
import { AggregateAnalyticsDashboardComponent } from "./traffic-stats/aggregate-analytics-dashboard/aggregate-analytics-dashboard.component";

@NgModule({
    imports: [
        RouterModule.forChild([
            { path: "", redirectTo: "/app/crm/dashboard", pathMatch: "full" },
            {
                path: "",
                children: [
                    {
                        path: "zapier",
                        component: ZapierComponent,
                        data: { permission: AppPermissions.CRM, reuse: true },
                    },
                    {
                        path: "traffic-stats/lead-conversion-journey",
                        component: LeadConversionJourneyComponent,
                        data: { permission: AppPermissions.CRM, reuse: true },
                    },
                    {
                        path: "traffic-stats/aggregate-analytics-dashboard",
                        component: AggregateAnalyticsDashboardComponent,
                        data: { permission: AppPermissions.CRM, reuse: true },
                    },
                    {
                        path: "welcome",
                        component: WelcomeComponent,
                        data: { permission: AppPermissions.CRM, reuse: true },
                    },
                    {
                        path: "start",
                        component: ShortcutsComponent,
                        data: { permission: AppPermissions.CRM, reuse: true },
                    },
                    {
                        path: "dashboard",
                        component: DashboardComponent,
                        data: { permission: AppPermissions.CRM, reuse: true },
                    },
                    {
                        path: "documents",
                        component: DocumentsComponent,
                        data: {
                            permission: AppPermissions.CRMFileStorageTemplates,
                            reuse: true,
                        },
                    },
                    {
                        path: "clients",
                        component: ClientsComponent,
                        data: {
                            permission: AppPermissions.CRMCustomers,
                            reuse: true,
                        },
                    },
                    {
                        path: "products",
                        component: ProductsComponent,
                        data: {
                            permission: AppPermissions.CRMProducts,
                            reuse: true,
                        },
                    },
                    {
                        path: "coupons",
                        component: CouponsComponent,
                        data: {
                            permission: AppPermissions.CRMProducts,
                            reuse: true,
                        },
                    },
                    {
                        path: "partners",
                        component: PartnersComponent,
                        data: {
                            permission: AppPermissions.CRMPartners,
                            reuse: true,
                        },
                    },
                    {
                        path: "leads",
                        component: LeadsComponent,
                        data: { reuse: true, reuseComponent: true },
                        canActivate: [CrmContactGroupGuard],
                    },
                    {
                        path: "orders",
                        component: OrdersComponent,
                        data: {
                            permission: AppPermissions.CRMOrders,
                            reuse: true,
                        },
                    },
                    {
                        path: "invoices",
                        component: InvoicesComponent,
                        data: {
                            permission: AppPermissions.CRMOrdersInvoices,
                            reuse: true,
                        },
                    },
                    {
                        path: "import-leads",
                        component: ImportLeadsComponent,
                        data: {
                            permission: AppPermissions.CRMBulkImport,
                            reuse: true,
                        },
                    },
                    {
                        path: "import-list",
                        component: ImportListComponent,
                        data: {
                            permission: AppPermissions.CRMBulkImport,
                            reuse: true,
                        },
                    },
                    {
                        path: "activity",
                        component: ActivityComponent,
                        data: { permission: AppPermissions.CRM, reuse: true },
                    },
                    {
                        path: "tenant-reports",
                        component: TenantReportsComponent,
                        data: {
                            permission: AppPermissions.Tenants,
                            reuse: true,
                        },
                    },
                    {
                        path: "reports",
                        component: ReportsComponent,
                        data: { permission: AppPermissions.CRM, reuse: true },
                    },
                    {
                        path: "commission-history",
                        component: CommissionHistoryComponent,
                        data: {
                            feature: AppFeatures.CRMCommissions,
                            permission: AppPermissions.CRMAffiliatesCommissions,
                            reuse: true,
                        },
                    },
                ],
            },
        ]),
    ],
    exports: [RouterModule],
})
export class CrmRoutingModule {}
