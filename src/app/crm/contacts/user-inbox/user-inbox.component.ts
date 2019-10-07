/** Core imports */
import { Injector, Component, OnDestroy, ViewChild, HostListener } from '@angular/core';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { AppComponentBase } from '@shared/common/app-component-base';
import { ContactServiceProxy } from '@shared/service-proxies/service-proxies';
import { ContactsService } from '../contacts.service';

@Component({
    selector: 'user-inbox',
    templateUrl: './user-inbox.component.html',
    styleUrls: ['./user-inbox.component.less']
})
export class UserInboxComponent extends AppComponentBase implements OnDestroy {

    constructor(injector: Injector,
        public dialog: MatDialog,
        private contactsService: ContactsService
    ) {
        super(injector);

        contactsService.contactInfoSubscribe(() => {
            setTimeout(() => {
                contactsService.toolbarUpdate([{
                    location: 'before',
                    text: this.l('Inbox')
                }]);
            });
        }, this.constructor.name);
    }

    ngOnDestroy() {
    }
}