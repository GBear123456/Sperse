import { Component, OnInit, OnDestroy } from '@angular/core';
import { ContactsService } from '../contacts.service';
import {
    UserServiceProxy,
    UserLoginServiceProxy,
    UserLoginAttemptDto,
    ListResultDtoOfUserLoginAttemptDto
} from '@shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { UrlHelper } from '@shared/helpers/UrlHelper';
import { DateHelper } from '@shared/helpers/DateHelper';
import { AppConsts } from '@shared/AppConsts';

@Component({
    selector: 'login-attempts',
    templateUrl: './login-attempts.component.html',
    styleUrls: ['./login-attempts.component.less']
})
export class LoginAttemptsComponent implements OnInit, OnDestroy {
    userLoginAttempts: UserLoginAttemptDto[];
    private readonly ident = 'LoginAttempts';
    urlHelper = UrlHelper;
    userTimezone = DateHelper.getUserTimezone();
    formatting = AppConsts.formatting;

    constructor(
        private userService: UserServiceProxy,
        private userLoginService: UserLoginServiceProxy,
        private contactsService: ContactsService,
        public ls: AppLocalizationService
    ) {}

    ngOnInit() {
        this.contactsService.userSubscribe(
            (userId: number) => {
                if (userId) this.loadData(userId);
            },
            this.ident
        );
        if (this.userService['data'].userId)
            this.loadData(this.userService['data'].userId);
    }

    loadData(userId: number) {
        this.userLoginService.getRecentLoginAttemptsForOtherUser(userId)
            .subscribe((result: ListResultDtoOfUserLoginAttemptDto) => {
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
        this.contactsService.unsubscribe(this.ident);
    }
}
