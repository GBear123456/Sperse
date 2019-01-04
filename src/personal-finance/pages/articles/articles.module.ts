import { NgModule } from '@angular/core';
import { ArticlesComponent } from '@root/personal-finance/pages/articles/articles.component';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LayoutModule } from '@root/personal-finance/shared/layout/layout.module';

@NgModule({
    declarations: [ ArticlesComponent ],
    imports: [
        CommonModule,
        LayoutModule,
        RouterModule.forChild([{
            path: '',
            component: ArticlesComponent
        }])
    ]
})
export class ArticlesModule {}
