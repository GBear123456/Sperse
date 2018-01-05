import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SetupComponent } from './setup.component';
import { SetupRouteGuard } from './shared/common/auth/auth-route-guard';

@NgModule({
    imports: [
        RouterModule.forChild([
            {
                path: '',
                component: SetupComponent,
                canActivate: [SetupRouteGuard],
                canActivateChild: [SetupRouteGuard],
                children: [
                    {
                        path: 'cfo',
                        loadChildren: 'setup_module/cfo/cfo.module#CfoModule',
                        data: { preload: true }
                    }
                ]
            }
        ])
    ],
    exports: [RouterModule]
})
export class SetupRoutingModule { }
