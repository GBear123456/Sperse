import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { AppCommonModule } from '@app/shared/common/app-common.module';
import { LeftMenuComponent } from './left-menu.component';

@NgModule({
    imports: [
        CommonModule,
        AppCommonModule
    ],
    declarations: [
        LeftMenuComponent
    ],
    exports: [LeftMenuComponent]
})
export class LeftMenuModule {}