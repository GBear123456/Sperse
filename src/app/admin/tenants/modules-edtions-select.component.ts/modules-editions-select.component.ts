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

    constructor(
        private _notifyService: NotifyService,
        private _ls: AppLocalizationService,
    ) {
    }

    onEditionChange(e, moduleId: string) {
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
            this._notifyService.error(this._ls.ls(AppConsts.localization.defaultLocalizationSourceName, 'ProductsWithoutUsersCount', emptyMaxCount.join(', ')));

        return !emptyMaxCount.length;
    }
}
