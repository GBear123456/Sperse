import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Route } from '@angular/router';
import { SwaggerComponent } from './swagger/swagger.component';
import { IntroductionComponent } from './introduction/introduction.component';

@NgModule({
    imports: [
        RouterModule.forChild([
            { path: '', redirectTo: '/app/api/introduction', pathMatch: 'full' },
            {
                path: '',
                children: [
                    { path: 'swagger', component: SwaggerComponent, data: { permission: '' } },
                    { path: 'introduction', component: IntroductionComponent, data: { permission: '' } },
                ]
            }
        ])
    ],
    exports: [
        RouterModule
    ]
})
export class ApiRoutingModule { }
