import { Component, Injector } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AppComponentBase } from '@shared/common/app-component-base';

@Component({
    templateUrl: './access-denied.component.html',
    styleUrls: ['./access-denied.component.less'],
})
export class AccessDeniedComponent extends AppComponentBase {
    constructor(injector: Injector) {
        super(injector);
    }}
