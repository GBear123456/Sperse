import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ThemeToggleComponent } from "./components/theme-toggle/theme-toggle.component";
import { LucideAngularModule, Sun, Moon } from "lucide-angular";

@NgModule({
    declarations: [ThemeToggleComponent],
    imports: [CommonModule, LucideAngularModule.pick({ Sun, Moon })],
    exports: [ThemeToggleComponent],
})
export class SharedModule {}
