import { Component, Injector, OnDestroy } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { UiCustomizationSettingsEditDto, UiCustomizationSettingsServiceProxy } from '@shared/service-proxies/service-proxies';

@Component({
    templateUrl: './ui-customization.component.html',
    animations: [appModuleAnimation()]
})
export class UiCustomizationComponent extends AppComponentBase implements OnDestroy {

    settings: UiCustomizationSettingsEditDto;
    private rootComponent: any;

    constructor(
        injector: Injector,
        private _uiCustomizationService: UiCustomizationSettingsServiceProxy
    ) {
        super(injector);
        this.rootComponent = this.getRootComponent();
        this.rootComponent.pageHeaderFixed();
    }

    ngAfterViewChecked(): void {
        //Temporary fix for: https://github.com/valor-software/ngx-bootstrap/issues/1508
        $('tabset ul.nav').addClass('m-tabs-line');
        $('tabset ul.nav li a.nav-link').addClass('m-tabs__link');
    }

    ngOnInit(): void {
        this._uiCustomizationService.getUiManagementSettings().subscribe((settingsResult) => {
            this.settings = settingsResult;
        });
    }

    ngOnDestroy() {
        this.rootComponent.pageHeaderFixed(true);
    }

    leftMenuPositionSelected(): boolean {
        return this.settings.menu.position === "left";
    }

    updateDefaultUiManagementSettings(): void {
        this._uiCustomizationService.updateDefaultUiManagementSettings(this.settings).subscribe(() => {
            window.location.reload();
        });
    }

    updateUiManagementSettings(): void {
        this._uiCustomizationService.updateUiManagementSettings(this.settings).subscribe(() => {
            window.location.reload();
        });
    }

    useSystemDefaultSettings(): void {
        this._uiCustomizationService.useSystemDefaultSettings().subscribe(() => {
            window.location.reload();
        });
    }

    allowAsideMinimizingChange(val): void {
        if (val) {
            this.settings.menu.allowAsideHiding = false;
            this.settings.menu.defaultHiddenAside = false;
        } else {
            this.settings.menu.defaultMinimizedAside = false;
        }
    }

    allowAsideHidingChange(val): void {
        if (!val) {
            this.settings.menu.defaultHiddenAside = false;
        }
    }
}
