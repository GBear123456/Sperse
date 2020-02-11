/** Core imports */
import { ChangeDetectionStrategy, Component, Inject, ViewChild, OnInit } from '@angular/core';

/** Third party imports */
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import * as _ from 'underscore';

/** Application imports */
import { PersonOrgRelationServiceProxy } from 'shared/service-proxies/service-proxies';
import { ContactListDialogComponent } from '../contact-list-dialog/contact-list-dialog.component';
import { ContactsService } from '../contacts.service';
import { AppLocalizationService } from '../../../shared/common/localization/app-localization.service';
import { NotifyService } from 'abp-ng2-module/dist/src/notify/notify.service';

@Component({
    selector: 'relation-companies-dialog',
    templateUrl: './relation-companies-dialog.component.html',
    styleUrls: ['./relation-companies-dialog.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class RelationCompaniesDialogComponent implements OnInit {
    @ViewChild(ContactListDialogComponent, { static: true }) contactList: ContactListDialogComponent;
    manageAllowed = false;

    constructor(
        private relationsServiceProxy: PersonOrgRelationServiceProxy,
        private contactsService: ContactsService,
        private notify: NotifyService,
        public dialogRef: MatDialogRef<ContactListDialogComponent>,
        public ls: AppLocalizationService,
        @Inject(MAT_DIALOG_DATA) public data: any,
    ) {}

    ngOnInit() {
        this.contactList.title = this.ls.l('Related Companies');
        this.contactList.addNewTitle = this.ls.l('Add Contact');
        this.contactList.photoType = 'Organization';
        this.contactList.data = this.data;
        this.contactList.manageAllowed = this.manageAllowed =
            this.contactsService.checkCGPermission(this.data.groupId);

        this.contactList.filter = (search?) => {
            return this.data.personContactInfo.orgRelations.map((item) => {
                let contact = item.organization;
                contact['relation'] = item;
                return (contact.id != this.data['organizationContactInfo'].id)
                    && (contact.name.toLowerCase().indexOf(search) >= 0) ? contact : null;
            }).filter(Boolean).sort((item) => (item.id == this.data.primaryOrganizationContactId ? -1 : 1));
        };

        this.contactList.filterList();
    }

    setPrimary(event, contact) {
        this.relationsServiceProxy.setPrimaryOrgRelation(contact.relation.id).subscribe(
            () => {
                let orgRelations = this.data.personContactInfo.orgRelations;
                let orgRelation = _.find(orgRelations, orgRelation => orgRelation.isPrimary);
                orgRelation.isPrimary = false;
                orgRelation = _.find(orgRelations, orgRelation => orgRelation.id === contact.relation.id);
                orgRelation.isPrimary = true;
                this.data.primaryOrganizationContactId = contact.id;
                this.notify.info(this.ls.l('SavedSuccessfully'));
                this.dialogRef.close(contact);
            },
            (e) => { this.notify.error(e); }
        );
        event.stopPropagation();
    }
}
