import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ZapierComponent } from "./zapier.component";
import { LeftMenuModule } from '@app/crm/shared/common/left-menu/left-menu.module';

@NgModule({
    imports: [
        CommonModule,
        LeftMenuModule
    ],
    declarations: [
        ZapierComponent
    ],
    exports: [ZapierComponent],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ZapierModule {}