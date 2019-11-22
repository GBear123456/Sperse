/** Core imports */
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

/** Application imports */
import { PersonalFinanceLayoutModule } from '@shared/personal-finance-layout/personal-finance-layout.module';
import { NotFoundComponent } from '@shared/not-found/not-found.component';
import { NotFoundRoutingModule } from '@shared/not-found/not-found-routing.module';
import { LoadingService } from '@shared/common/loading-service/loading.service';
import { CacheHelper } from '@shared/common/cache-helper/cache-helper';
import { AppUrlService } from '@shared/common/nav/app-url.service';

@NgModule({
    imports: [
        CommonModule,
        PersonalFinanceLayoutModule,
        NotFoundRoutingModule
    ],
    declarations: [
        NotFoundComponent
    ],
    exports: [
        NotFoundComponent
    ],
    providers: [
        CacheHelper,
        AppUrlService,
        LoadingService
    ]
})
export class NotFoundModule {}