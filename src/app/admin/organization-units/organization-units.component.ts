import { Component, ViewChild } from '@angular/core';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { OrganizationTreeComponent } from './organization-tree/organization-tree.component';
import { OrganizationUnitMembersComponent } from './organization-unit-members/organization-unit-members.component';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    templateUrl: './organization-units.component.html',
    styleUrls: ['./organization-units.component.less'],
    animations: [appModuleAnimation()]
})
export class OrganizationUnitsComponent {
    @ViewChild('ouMembers') ouMembers: OrganizationUnitMembersComponent;
    @ViewChild('ouTree') ouTree: OrganizationTreeComponent;

    constructor(public ls: AppLocalizationService) {}
}
