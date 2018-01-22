import { NgModule, ApplicationRef, Injector, AfterViewInit } from '@angular/core';
import { Routes, RouterModule, Router, NavigationEnd } from '@angular/router';
import { AppUiCustomizationService } from '@shared/common/ui/app-ui-customization.service';

const routes: Routes = [
    {path: '', redirectTo: '/app/main/start', pathMatch: 'full' },
    {
        path: 'account',
        loadChildren: 'account/account.module#AccountModule', //Lazy load account module
        data: {preload: true}
    }
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})

export class RootRoutingModule implements AfterViewInit {
    constructor(private _router: Router,
                private _injector: Injector,
                private _applicationRef: ApplicationRef) { }

    ngAfterViewInit() {
        this._router.events.subscribe((event: NavigationEnd) => {
                setTimeout(() => {
                    this._injector.get(this._applicationRef.componentTypes[0])
                        .checkSetClasses(abp.session.userId || (event.url.indexOf('/account/') >= 0));
                }, 0);
            }
        );
    }

    getSetting(key: string): string {
        return abp.setting.get(key);
    }
}
