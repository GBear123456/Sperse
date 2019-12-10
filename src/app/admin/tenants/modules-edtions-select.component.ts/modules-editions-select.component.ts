import { Component, Input } from '@angular/core';
import { TenantEditEditionDto, SubscribableEditionComboboxItemDto } from '@shared/service-proxies/service-proxies';
import { NotifyService } from 'abp-ng2-module/dist/src/notify/notify.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { AppConsts } from '@root/shared/AppConsts';

@Component({
    selector: 'modules-editions-select',
    templateUrl: './modules-editions-select.component.html',
    styleUrls: [ './modules-editions-select.component.less' ]
})
export class ModulesEditionsSelectComponent {
    @Input() editionsModels: { [value: string]: TenantEditEditionDto };
    @Input() editionsGroups: SubscribableEditionComboboxItemDto[][];
    private readonly incompatibleModules = {
        'CRM': [ 'CFO_CRM', 'CFO_Partner' ],
        'CFO': [ 'CFO_CRM', 'CFO_Partner' ],
        'CFO_CRM': [ 'CRM', 'CFO', 'CFO_Partner' ],
        'CFO_Partner': [ 'CRM', 'CFO', 'CFO_CRM' ]
    };

    constructor(
        private notifyService: NotifyService,
        private ls: AppLocalizationService,
    ) {}

    onEditionChange(moduleId: string) {
        /** if edition value 'Not Assigned' - clear max count */
        if (this.editionsModels[moduleId].editionId == 0) {
            this.editionsModels[moduleId].maxUserCount = null;
        }
    }

    validateModel(): boolean {
        let emptyMaxCount = Object.keys(this.editionsModels)
            .filter(key => {
                if (this.editionsModels[key].editionId != 0 && !this.editionsModels[key].maxUserCount) {
                    let editionGroup = this.editionsGroups.find(v => v[1].moduleId == key);
                    let edition = editionGroup.find(v => v.value == this.editionsModels[key].editionId.toString());
                    if (!edition.isFree)
                        return true;
                }
                return false;
            });
        if (emptyMaxCount.length)
            this.notifyService.error(this.ls.ls(AppConsts.localization.defaultLocalizationSourceName, 'ProductsWithoutUsersCount', emptyMaxCount.join(', ')));

        return !emptyMaxCount.length;
    }

    editionIsNotFreeOrNotAssigned(editionModel: TenantEditEditionDto, editionGroupIndex: number): boolean {
        const editionId = editionModel.editionId;
        const edition = this.editionsGroups[editionGroupIndex].find((edition: SubscribableEditionComboboxItemDto) => {
            return +edition.value === +editionId;
        });
        let result: boolean = edition && !edition.isFree && edition.value !== '0';
        if (!result) {
            editionModel.trialDayCount = null;
        }
        return result;
    }

    editionIsAssigned(editionModel: TenantEditEditionDto, editionGroupIndex: number): boolean {
        const editionId = editionModel.editionId;
        const edition = this.editionsGroups[editionGroupIndex].find((edition: SubscribableEditionComboboxItemDto) => {
            return +edition.value === +editionId;
        });
        return edition && edition.value !== '0';
    }

    moduleIsDisabled(moduleId: string): boolean {
        return this.incompatibleModules[moduleId] && this.incompatibleModules[moduleId].some((incompatibleModule: string) => {
            const incompatibleModuleIsAssigned = this.editionsModels[incompatibleModule].editionId != 0;
            if (incompatibleModuleIsAssigned) {
                this.editionsModels[moduleId].maxUserCount = null;
                this.editionsModels[moduleId].trialDayCount = null;
            }
            return incompatibleModuleIsAssigned;
        });
    }

    showCleanIcon(editionModel: TenantEditEditionDto, editionGroupIndex: number): boolean {
        return editionModel.maxUserCount != null || editionModel.trialDayCount != null ||
            this.editionIsAssigned(editionModel, editionGroupIndex);
    }

    clearEdition(editionModel: TenantEditEditionDto): void {
        editionModel.maxUserCount = null;
        editionModel.trialDayCount = null;
        editionModel.editionId = 0;
    }
}
