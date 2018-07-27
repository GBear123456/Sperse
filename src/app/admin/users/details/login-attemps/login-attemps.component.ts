import { Injector, Component, OnInit } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';

import { UserServiceProxy, UserLoginServiceProxy, UserLoginAttemptDto } from '@shared/service-proxies/service-proxies';
import * as moment from 'moment';

@Component({
    selector: 'login-attemps.component',
    templateUrl: './login-attemps.component.html',
    styleUrls: ['./login-attemps.component.less']
})
export class LoginAttempsComponent extends AppComponentBase implements OnInit {
    userLoginAttempts: UserLoginAttemptDto[];

    constructor(injector: Injector,
        private _userService: UserServiceProxy,
        private _userLoginService: UserLoginServiceProxy) {
        super(injector);
    }

    ngOnInit() {
        let userId = this._userService['data'].userId;

        this._userLoginService.getRecentLoginAttemptsForOtherUser(userId).subscribe(result => {
            this.userLoginAttempts = result.items;
            result.items.forEach(v => {
                v['creationTimeFormatted'] = moment(v.creationTime).fromNow() + ' (' + moment(v.creationTime).format('YYYY-MM-DD hh:mm:ss') + ')';
            });
        });
    }

    onRowPrepared(e) {
        if (e.rowType == 'data') {
            if (e.data.result == 'Success')
                e.rowElement.classList.add('success-row');
            else
                e.rowElement.classList.add('failed-row');
        }
    }
}
