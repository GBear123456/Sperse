/** Core imports */
import { Component } from '@angular/core';

/** Application imports */
import { HostLoginComponent } from '../host/host-login.component';

@Component({
    templateUrl: './ghost-login.component.html',
    styleUrls: ['./ghost-login.component.less']
})
export class GHostLoginComponent extends HostLoginComponent {}