import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ZapierComponent } from "./zapier.component";

@NgModule({
  imports: [CommonModule],
  declarations: [ZapierComponent],
  exports: [ZapierComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ZapierModule {}