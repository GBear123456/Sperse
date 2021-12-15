/** Core imports */
import { Component, Inject, ElementRef, ViewChild } from '@angular/core';

/** Third party imports */
import { DxSelectBoxComponent } from 'devextreme-angular/ui/select-box';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

/** Application imports */
import { NotifyService } from 'abp-ng2-module';
import { ContactServiceProxy } from '@shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    templateUrl: 'add-instance-user-dialog.html',
    styleUrls: ['add-instance-user-dialog.less']
})
export class AddInstanceUserDialogComponent {
    @ViewChild(DxSelectBoxComponent) userComponent: DxSelectBoxComponent;
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
        this.contactProxy.getAllByPhrase(phrase, 10, true, this.data.exceptUserIds, false).subscribe(res => {
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
        if (!this.contacts.length)
            this.contactLookupRequest('', () => {
                this.userComponent.instance.option('value', '');
            });
    }

    onSave() {
        if (this.userId)
            this.dialogRef.close({
                userId: this.userId,
                sendInvitationEmail: this.sendInvitationEmail
            });
        else
            this.userComponent.instance.option('isValid', false);
    }
}