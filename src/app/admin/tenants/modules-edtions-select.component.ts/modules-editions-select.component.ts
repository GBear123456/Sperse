import { Component, Input } from '@angular/core';
import { TenantEditEditionDto } from '@shared/service-proxies/service-proxies';

@Component({
    selector: 'modules-editions-select',
    templateUrl: './modules-editions-select.component.html',
    styleUrls: [ './modules-editions-select.component.less' ]
})
export class ModulesEditionsSelectComponent {
    @Input() editionsModels: { [value: string]: TenantEditEditionDto };
    @Input() editionsGroups;

    onEditionChange(e, moduleId: string) {
        /** if edition value 'Not Assigned' - clear max count */
        if (this.editionsModels[moduleId].editionId == 0) {
            this.editionsModels[moduleId].maxUserCount = null;
        }
    }
}
