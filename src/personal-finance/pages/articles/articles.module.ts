import { NgModule } from '@angular/core';
import { ArticlesComponent } from '@root/personal-finance/pages/articles/articles.component';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@NgModule({
    declarations: [ ArticlesComponent ],
    imports: [
        CommonModule,
        RouterModule.forChild([{
            path: '',
            component: ArticlesComponent
        }])
    ]
})
export class ArticlesModule {}
