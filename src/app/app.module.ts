import { NgModule } from '@angular/core';

import { LayoutModule } from './shared/layout/layout.module';
import { AppCommonModule } from './shared/common/app-common.module';
import { AppRoutingModule } from './app-routing.module';

import { AppComponent } from './app.component';

import { ImpersonationService } from './admin/users/impersonation.service';

@NgModule({
    declarations: [
        AppComponent
    ],
    imports: [
		LayoutModule,
        AppRoutingModule,
		AppCommonModule.forRoot()
    ],
    providers: [
        ImpersonationService
    ]
})
export class AppModule { }