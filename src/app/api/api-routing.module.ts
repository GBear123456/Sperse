import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Route } from '@angular/router';
import { SwaggerComponent } from './swagger/swagger.component';

@NgModule({
    imports: [
        RouterModule.forChild([
            { path: '', redirectTo: '/app/api/swagger', pathMatch: 'full' },
            {
              path: '',
              children: [
                { path: 'swagger', component: SwaggerComponent , data: { permission: '' } }
              ]
            }
        ])
    ],
    exports: [
        RouterModule
    ]
})
export class ApiRoutingModule { }