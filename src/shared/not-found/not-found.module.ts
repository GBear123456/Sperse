import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PersonalFinanceLayoutModule } from '@shared/personal-finance-layout/personal-finance-layout.module';
import { NotFoundComponent } from '@shared/not-found/not-found.component';
import { NotFoundRoutingModule } from '@shared/not-found/not-found-routing.module';
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
        AppUrlService
    ]
})
export class NotFoundModule {}
