/** Core imports */
import { Component, Input } from '@angular/core';

/** Third party imports */
import capitalize from 'underscore.string/capitalize';

/** Application imports */
import { PersonContactServiceProxy, UpdatePersonNameInput } from 'shared/service-proxies/service-proxies';
import { ContactsService } from '../contacts.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { AppPermissionService } from '@shared/common/auth/permission.service';

@Component({
    selector: 'person-info',
    templateUrl: './person-info.component.html',
    styleUrls: ['./person-info.component.less']
})
export class PersonInfoComponent {
    @Input() data;
    @Input() groups;
    capitalize = capitalize;
    isEditAllowed = this.permissionService.checkCGPermission(this.groups);
    constructor(
        private contactsService: ContactsService,
        private personContactService: PersonContactServiceProxy,
        private permissionService: AppPermissionService,
        public ls: AppLocalizationService
    ) {}

    getFullName(person) {
        return [person.namePrefix, person.firstName, person.middleName, person.lastName,
            person.nameSuffix && (', ' + person.nameSuffix), person.nickName && ('(' + person.nickName + ')')].filter(Boolean).join(' ');
    }

    updateValue(value, propName) {
        value = value.trim();
        let person = this.data.person;
        person[propName] = value;
        if (this.data.id)
            this.personContactService.updatePersonName(
                UpdatePersonNameInput.fromJS({...{id: this.data.id}, ...person})
            ).subscribe(result => {
                this.data.fullName = result.fullName;
            });
        else
            this.data.fullName = this.getFullName(person);
    }
}
