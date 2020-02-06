/** Core imports */
import { Component, Inject, ElementRef } from '@angular/core';

/** Third party imports */
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { finalize } from 'rxjs/operators';

/** Application imports */
import { NotifyService } from '@abp/notify/notify.service';
import { ContactServiceProxy } from '@shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    templateUrl: 'add-instance-user-dialog.html',
    styleUrls: ['add-instance-user-dialog.less']
})
export class AddInstanceUserDialogComponent {
    userId: number;
    contacts: any = [];
    sendInvitationEmail = false;

    private lookupTimeout: any;
    private latestSearchPhrase: string;
    constructor(
        private notify: NotifyService,
        private elementRef: ElementRef,
        private contactProxy: ContactServiceProxy,
        public dialogRef: MatDialogRef<AddInstanceUserDialogComponent>,
        public ls: AppLocalizationService,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        this.contactLookupRequest();
    }

    contactLookupRequest(phrase = '', callback?) {
        this.contactProxy.getAllByPhrase(phrase, 10, true, this.data.exceptUserIds).subscribe(res => {
            if (!phrase || phrase == this.latestSearchPhrase) {
                this.contacts = res;
                callback && callback(res);
            }
        });
    }

    contactLookupItems(event) {
        let search = this.latestSearchPhrase = event.event.target.value;
        if (this.contacts.length)
            this.contacts = [];

        event.component.option('opened', true);
        event.component.option('noDataText', this.ls.l('LookingForItems'));

        clearTimeout(this.lookupTimeout);
        this.lookupTimeout = setTimeout(() => {
            event.component.option('opened', true);
            event.component.option('noDataText', this.ls.l('LookingForItems'));

            this.contactLookupRequest(search, res => {
                if (!res['length'])
                    event.component.option('noDataText', this.ls.l('NoItemsFound'));
            });
        }, 500);
    }

    lookupFocusIn($event) {
        $event.component.option('opened', Boolean(this.contacts.length));
    }

    onSave() {
        this.dialogRef.close({
            userId: this.userId,
            sendInvitationEmail: this.sendInvitationEmail
        });
    }
}