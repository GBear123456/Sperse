import { NgModule } from '@angular/core';
import { LendspaceWelcome2Component } from '@root/personal-finance/pages/lendspace-welcome2/lendspace-welcome2.component';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LayoutModule } from '@root/personal-finance/shared/layout/layout.module';

@NgModule({
    imports: [
        CommonModule,
        LayoutModule,
        RouterModule.forChild([{
            path: '',
            component: LendspaceWelcome2Component
        }])
    ],
    declarations: [
        LendspaceWelcome2Component
    ]
})
export class LendspaceWelcome2Module {}
