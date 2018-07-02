import { Component, OnInit, Injector, Input } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppConsts } from '@shared/AppConsts';
import { UserServiceProxy, GetUserForEditOutput, UserRoleDto } from '@shared/service-proxies/service-proxies';

@Component({
    selector: 'user-account',
    templateUrl: './user-account.component.html',
    styleUrls: ['./user-account.component.less']
})
export class UserAccountComponent extends AppComponentBase implements OnInit {
    data: GetUserForEditOutput;
    roles: UserRoleDto[] = [];

    sendActivationEmail = false;
    setRandomPassword = false;

    constructor(injector: Injector,
        private _userService: UserServiceProxy) {
        super(injector);
    }

    ngOnInit() {
        this.data = this._userService['data'];
        this.roles = this.data.roles;
    }
}
