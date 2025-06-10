/** Core imports */
import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';

/** Third party imports */

/** Application imports */
import {
    EmailTemplateServiceProxy,
    EmailTemplateType,
    CustomWelcomeTemplate
} from '@shared/service-proxies/service-proxies';
import { NotifyService } from 'abp-ng2-module';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { ContactGroup } from '@shared/AppEnums';
import { AppConsts } from '@shared/AppConsts';

@Component({
    selector: 'contact-group-templates',
    templateUrl: 'contact-group-templates.component.html',
    styleUrls: ['contact-group-templates.component.less'],
    providers: [EmailTemplateServiceProxy],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContactGroupTemplatesComponent {
    allGroupsId = 'All';
    allGroupsItem = new CustomWelcomeTemplate({ groupId: this.allGroupsId, templateId: null });

    @Input() title: string;
    @Input() templateType: EmailTemplateType;
    @Input() showSystemDefault: boolean = true;
    @Input()
    get customTemplates(): CustomWelcomeTemplate[] {
        return this.getTemplates();
    }
    set customTemplates(inputValues: CustomWelcomeTemplate[]) {
        let triggerChange = true;
        let values: CustomWelcomeTemplate[];
        if (!inputValues || !inputValues.length) {
            values = [this.allGroupsItem];
        } else {
            let allGroupsIndex = null;
            values = inputValues.map((v, i) => {
                let groupId = v.groupId;
                if (!groupId && allGroupsIndex == null) {
                    allGroupsIndex = i;
                    groupId = this.allGroupsId;

                    if (this.internalTemplates) {
                        let existingAllGroupsItem = this.internalTemplates.find(v => v.groupId == this.allGroupsId);
                        if (existingAllGroupsItem) {
                            existingAllGroupsItem.templateId = v.templateId;
                            return existingAllGroupsItem;
                        }
                    }
                    return new CustomWelcomeTemplate({ groupId: groupId, templateId: v.templateId });
                }
                return v;
            });
            if (allGroupsIndex == null)
                values.unshift(this.allGroupsItem);
            else {
                if (allGroupsIndex != 0) {
                    let item = values[allGroupsIndex];
                    values.splice(allGroupsIndex, 1);
                    values.unshift(item);
                }
                else {
                    triggerChange = false;
                }
            }
        }
        this.internalTemplates = values;
        this.resetGroupsDisabled();
        this.setAddButtonVisibility();
        this.internalTemplates.forEach(v => this.changeContactGroupAviability(v.groupId, true));

        if (triggerChange) {
            this.customTemplatesChange.emit(this.getTemplates());
        }
    }
    @Output() customTemplatesChange = new EventEmitter<CustomWelcomeTemplate[]>();

    internalTemplates: CustomWelcomeTemplate[];
    contactGroups: {
        id: string;
        name: string;
        disabled?: boolean;
    }[] = [];
    hideAddButton: boolean = false;

    constructor(
        public ls: AppLocalizationService,
        private notifyService: NotifyService
    ) {
        this.contactGroups.push({ id: this.allGroupsId, name: 'All', disabled: true });
        Object.keys(ContactGroup).forEach(item => {
            this.contactGroups.push({
                id: ContactGroup[item],
                name: this.ls.ls(AppConsts.localization.CRMLocalizationSourceName, 'ContactGroup_' + item)
            });
        });
    }

    onContactGroupValueChanged(event) {
        this.changeContactGroupAviability(event.value, true);
        this.changeContactGroupAviability(event.previousValue, false);
        this.customTemplatesChange.emit(this.getTemplates());
    }

    onTemplateIdValueChanged(event, templateItem) {
        templateItem.templateId = event;
        this.customTemplatesChange.emit(this.getTemplates());
    }

    addRow() {
        if (this.internalTemplates.length < this.contactGroups.length) {
            this.internalTemplates.push(new CustomWelcomeTemplate({ groupId: null, templateId: null }));
        }
        this.setAddButtonVisibility();
    }

    removeRow(i, templateItem) {
        this.internalTemplates.splice(i, 1);
        this.changeContactGroupAviability(templateItem.groupId, false);
        this.setAddButtonVisibility();
        this.customTemplatesChange.emit(this.getTemplates());
    }

    resetGroupsDisabled() {
        this.contactGroups.forEach(v => v.disabled = false);
    }

    setAddButtonVisibility() {
        this.hideAddButton = this.internalTemplates.length >= this.contactGroups.length;
    }

    changeContactGroupAviability(itemId, isDisabled) {
        if (!itemId)
            return;

        this.contactGroups.find(v => v.id == itemId).disabled = isDisabled;
    }

    getTemplates(): CustomWelcomeTemplate[] {
        return this.internalTemplates.map(v => v.groupId == this.allGroupsId ? new CustomWelcomeTemplate({ groupId: null, templateId: v.templateId }) : v);
    }

    validate(): boolean {
        if (this.internalTemplates.some(v => v.groupId == null)) {
            this.notifyService.error(this.ls.l('EmptyTemplateRowsError'));
            return false;
        }
        return true;
    }
}