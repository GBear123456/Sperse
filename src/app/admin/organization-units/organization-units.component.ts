import { Component, Injector, ViewChild } from '@angular/core';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { AppComponentBase } from '@shared/common/app-component-base';
import { OrganizationTreeComponent } from './organization-tree.component';
import { OrganizationUnitMembersComponent } from './organization-unit-members.component';

@Component({
    templateUrl: './organization-units.component.html',
    styleUrls: ['./organization-units.component.less'],
    animations: [appModuleAnimation()]
})
export class OrganizationUnitsComponent extends AppComponentBase {

    @ViewChild('ouMembers') ouMembers: OrganizationUnitMembersComponent;
    @ViewChild('ouTree') ouTree: OrganizationTreeComponent;

    public headlineConfig = { 
      names: [this.l('OrganizationUnits')], 
      text: this.l('OrganizationUnitsHeaderInfo'),
      icon: 'rocket', 
      buttons: []
    };

    constructor(
        injector: Injector
    ) {
        super(injector);
    }
}
