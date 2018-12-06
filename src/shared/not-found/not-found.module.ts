import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PersonalFinanceHeaderModule } from '@shared/personal-finance-header/personal-finance-header.module';
import { NotFoundComponent } from '@shared/not-found/not-found.component';
import { NotFoundRoutingModule } from '@shared/not-found/not-found-routing.module';

@NgModule({
    imports: [
        CommonModule,
        PersonalFinanceHeaderModule,
        NotFoundRoutingModule
    ],
    declarations: [
        NotFoundComponent
    ],
    exports: [
        NotFoundComponent
    ]
})
export class NotFoundModule {}
