/** Core imports */
import { ChangeDetectionStrategy, Component, Inject, ViewChild, OnInit } from '@angular/core';

/** Third party imports */
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import * as _ from 'underscore';

/** Application imports */
import {
    OrganizationShortInfo,
    PersonOrgRelationServiceProxy,
    PersonOrgRelationShortInfo
} from 'shared/service-proxies/service-proxies';
import { ContactListDialogComponent } from '../contact-list-dialog/contact-list-dialog.component';
import { ContactsService } from '../contacts.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { NotifyService } from 'abp-ng2-module';
import { AppPermissionService } from '@shared/common/auth/permission.service';

@Component({
    selector: 'relation-companies-dialog',
    templateUrl: './relation-companies-dialog.component.html',
    styleUrls: ['./relation-companies-dialog.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class RelationCompaniesDialogComponent implements OnInit {
    @ViewChild(ContactListDialogComponent, { static: true }) contactList: ContactListDialogComponent;
    manageAllowed: boolean = this.permissionService.checkCGPermission(this.data.groups);
    displayList: PersonOrgRelationShortInfo[] = this.search();

    constructor(
        private relationsServiceProxy: PersonOrgRelationServiceProxy,
        private contactsService: ContactsService,
        private notifyService: NotifyService,
        private permissionService: AppPermissionService,
        public dialogRef: MatDialogRef<ContactListDialogComponent>,
        public ls: AppLocalizationService,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {}

    ngOnInit() {
        this.contactList.data = this.data;
    }

    search(search?: string) {
        this.displayList = this.data.personContactInfo.orgRelations
            .map((item: PersonOrgRelationShortInfo) => {
                let contact = item.organization;
                contact['relation'] = item;
                return (contact.id != this.data['organizationContactInfo'].id)
                    && (!search || contact.name.toLowerCase().indexOf(search) >= 0) ? contact : null;
            })
            .filter(Boolean)
            .sort((item: OrganizationShortInfo) => (item.id == this.data.primaryOrganizationContactId ? -1 : 1));
        return this.displayList;
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
                this.notifyService.info(this.ls.l('SavedSuccessfully'));
                this.dialogRef.close(contact);
            },
            e => this.notifyService.error(e)
        );
        event.stopPropagation();
    }
}