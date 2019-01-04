import { NgModule } from '@angular/core';
import { LendspaceWelcomeComponent } from '@root/personal-finance/pages/lendspace-welcome/lendspace-welcome.component';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LayoutModule } from '@root/personal-finance/shared/layout/layout.module';

@NgModule({
    imports: [
        CommonModule,
        LayoutModule,
        RouterModule.forChild([{
            path: '',
            component: LendspaceWelcomeComponent
        }])
    ],
    declarations: [
        LendspaceWelcomeComponent
    ]
})
export class LendspaceWelcomeModule {}
