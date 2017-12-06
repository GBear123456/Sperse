import { NgModule, ApplicationRef, Injector, AfterViewInit } from '@angular/core';
import { Routes, RouterModule, Router, NavigationEnd } from '@angular/router';

const routes: Routes = [
    {path: '', redirectTo: '/app/main/dashboard', pathMatch: 'full'},
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
}
