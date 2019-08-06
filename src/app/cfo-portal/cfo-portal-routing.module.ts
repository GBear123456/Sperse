import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { StartComponent } from '@app/cfo/start/start.component';
import { PortalDashboardComponent } from './dashboard/dashboard.component';

@NgModule({
    imports: [
        RouterModule.forChild([
            { path: '', redirectTo: 'overview', pathMatch: 'full' },
            {
                path: '',
                children: [
                    { path: 'overview', component: StartComponent, data: { permission: '', reuse: true, host: PortalDashboardComponent } },
                ]
            }
        ])
    ],
    exports: [
        RouterModule
    ]
})
export class CfoPortalRoutingModule { }