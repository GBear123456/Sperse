import { ChangeDetectionStrategy, Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ContactListDialogComponent } from '@app/crm/contacts/contact-list-dialog/contact-list-dialog.component';
import { EntityContactInfo } from '@shared/service-proxies/service-proxies';

@Component({
    selector: 'customer-list-dialog',
    templateUrl: 'customer-list-dialog.component.html',
    styleUrls: [ 'customer-list-dialog.component.less' ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CustomerListDialogComponent implements OnInit {
    @ViewChild(ContactListDialogComponent, { static: true }) contactList: ContactListDialogComponent;

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: { contactList: EntityContactInfo[] }
    ) {}

    ngOnInit() {
        this.contactList.filter = (search?: string) => {
            return this.data.contactList.filter((customer: EntityContactInfo) => {
                return !search || customer.name.toLowerCase().indexOf(search) > -1;
            })
        }
    }
}