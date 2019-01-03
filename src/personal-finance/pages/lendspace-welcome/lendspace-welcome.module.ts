import { NgModule } from '@angular/core';
import { LendspaceWelcomeComponent } from '@root/personal-finance/pages/lendspace-welcome/lendspace-welcome.component';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@NgModule({
    imports: [
        CommonModule,
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
