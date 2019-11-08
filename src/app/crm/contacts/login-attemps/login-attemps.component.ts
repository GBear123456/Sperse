import { Component, OnInit, OnDestroy } from '@angular/core';
import { ContactsService } from '../contacts.service';
import { UserServiceProxy, UserLoginServiceProxy, UserLoginAttemptDto } from '@shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    selector: 'login-attemps',
    templateUrl: './login-attemps.component.html',
    styleUrls: ['./login-attemps.component.less']
})
export class LoginAttempsComponent implements OnInit, OnDestroy {
    userLoginAttempts: UserLoginAttemptDto[];

    constructor(
        private userService: UserServiceProxy,
        private userLoginService: UserLoginServiceProxy,
        private contactsService: ContactsService,
        public ls: AppLocalizationService
    ) {}

    ngOnInit() {
        this.contactsService.userSubscribe(
            (userId) => {
                if (userId) this.loadData(userId);
            },
            this.constructor.name
        );
        if (this.userService['data'].userId)
            this.loadData(this.userService['data'].userId);
    }

    loadData(userId) {
        this.userLoginService.getRecentLoginAttemptsForOtherUser(userId).subscribe(result => {
            this.userLoginAttempts = result.items;
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

    ngOnDestroy() {
        this.contactsService.unsubscribe(this.constructor.name);
    }
}
