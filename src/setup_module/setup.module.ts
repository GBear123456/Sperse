import { NgModule } from '@angular/core';

import { LayoutModule } from './shared/layout/layout.module';
import { SetupCommonModule } from './shared/common/setup-common.module';
import { SetupRoutingModule } from './setup-routing.module';

import { SetupComponent } from './setup.component';
import { SetupService } from './setup.service';

import { ImpersonationService } from '@admin/users/impersonation.service';

@NgModule({
    declarations: [
        SetupComponent
    ],
    imports: [
        LayoutModule,
        SetupRoutingModule,
        SetupCommonModule.forRoot()
    ],
    providers: [
        SetupService,
        ImpersonationService
    ]
})
export class SetupModule {}
