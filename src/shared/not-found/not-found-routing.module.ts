import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { NotFoundComponent } from '@shared/not-found/not-found.component';
import { LocalizationResolver } from '@shared/common/localization-resolver';

const routes: Routes = [
    {
        path: '**',
        component: NotFoundComponent,
        canActivate: [ LocalizationResolver ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class NotFoundRoutingModule { }
