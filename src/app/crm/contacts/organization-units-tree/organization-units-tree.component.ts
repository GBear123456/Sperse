/** Core imports */
import { Component, Input, ViewChild, OnDestroy } from '@angular/core';

/** Third party imports */
import DataSource from 'devextreme/data/data_source';
import { DxTreeViewComponent } from 'devextreme-angular/ui/tree-view';
import includes from 'lodash/includes';
import { finalize } from 'rxjs/operators';
import { ClipboardService } from 'ngx-clipboard';
import * as _ from 'underscore';

/** Application imports */
import { OrganizationUnitDto, OrganizationUnitServiceProxy,
    UsersToOrganizationUnitInput } from '@shared/service-proxies/service-proxies';
import { ContactsService } from '../contacts.service';
import { AppPermissions } from '@shared/AppPermissions';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { AppPermissionService } from '@shared/common/auth/permission.service';
import { NotifyService } from '@abp/notify/notify.service';
import { LoadingService } from '@shared/common/loading-service/loading.service';
import { AdAutoLoginHostDirective } from '../../../../account/auto-login/auto-login.component';

@Component({
    selector: 'oranization-units-tree',
    templateUrl: './organization-units-tree.component.html',
    styleUrls: ['./organization-units-tree.component.less']
})
export class OrganizationUnitsTreeComponent implements OnDestroy {
    @ViewChild(DxTreeViewComponent, { static: true }) organizationUnitsTree: DxTreeViewComponent;

    @Input() selectionMode = 'multiple';

    public oranizationUnitsDataSource: DataSource;
    public searchEnabled = false;
    public sortTreeDesc = false;

    isEditAllowed = false;

    private userId: number;
    private organizationUnitsData: OrganizationUnitDto[];
    private lastSelectedItemId: number;
    private ident = _.uniqueId(this.constructor.name);

    toolbarConfig = [
        {
            location: 'before', items: [
                {
                    name: 'find',
                    action: (event) => {
                        event.event.stopPropagation();
                        event.event.preventDefault();

                        this.searchEnabled = !this.searchEnabled;
                    }
                },
                {
                    name: 'sort',
                    action: (event) => {
                        event.event.stopPropagation();
                        event.event.preventDefault();

                        this.sortTreeDesc = !this.sortTreeDesc;
                        this.oranizationUnitsDataSource.sort({ getter: 'displayName', desc: this.sortTreeDesc });
                        this.oranizationUnitsDataSource.load();
                    }
                },
                {
                    name: 'expandTree',
                    widget: 'dxDropDownMenu',
                    options: {
                        hint: this.ls.l('Expand'),
                        items: [{
                            action: this.processExpandTree.bind(this, 1),
                            text: this.ls.l('Expand 1st level')
                        }, {
                            action: this.processExpandTree.bind(this, 2),
                            text: this.ls.l('Expand 2nd level')
                        }, {
                            action: this.processExpandTree.bind(this, 10),
                            text: this.ls.l('Expand all')
                        }, {
                            type: 'delimiter'
                        }, {
                            action: this.processExpandTree.bind(this, 0),
                            text: this.ls.l('Collapse all'),
                        }]
                    }
                }
            ]
        }
    ];

    constructor(
        private clipboardService: ClipboardService,
        private userOrgUnitsService: OrganizationUnitServiceProxy,
        private contactsService: ContactsService,
        private ls: AppLocalizationService,
        private permissionChecker: AppPermissionService,
        private notifyService: NotifyService,
        private loadingService: LoadingService
    ) {
        contactsService.orgUnitsSubscribe(
            (userData) => {
                this.userId = userData.user && userData.user.id;
                this.setOrganizationUnitsData(
                    userData.allOrganizationUnits,
                    userData.selectedOrgUnits
                );
            },
            this.ident
        );

        this.isEditAllowed = this.permissionChecker.isGranted(AppPermissions.AdministrationOrganizationUnitsManageMembers);
    }

    setOrganizationUnitsData(orgUnits: OrganizationUnitDto[], selectedOrgUnits: number[]) {
        this.organizationUnitsData = orgUnits;

        this.organizationUnitsData.forEach((item) => {
            if (item['selected'] = includes(selectedOrgUnits, item.id))
                this.lastSelectedItemId = item.id;
            item['expanded'] = true;
        });

        this.oranizationUnitsDataSource = new DataSource(this.organizationUnitsData);
        this.oranizationUnitsDataSource.sort({ getter: 'displayName', desc: this.sortTreeDesc });
    }

    getSelectedOrganizationUnits(): number[] {
        return this.organizationUnitsData.filter(item => item['selected']).map(item => item.id);
    }

    processExpandTree(expandLevel: number) {
        this.foreachNodes(this.organizationUnitsTree.instance.getNodes(), expandLevel);
    }

    private foreachNodes(nodes: any[], expandLevel: number, currentLevel: number = 1) {
        for (let i = 0; i < nodes.length; i++) {
            let item = nodes[i];

            if (expandLevel >= currentLevel)
                this.organizationUnitsTree.instance.expandItem(item.key);
            else
                this.organizationUnitsTree.instance.collapseItem(item.key);

            if (item.children && item.children.length) {
                this.foreachNodes(item.children, expandLevel, currentLevel + 1);
            }
        }
    }

    onChange(event) {
        if (this.userId && this.selectionMode == 'multiple')
            (event.itemData.selected
                ? this.userOrgUnitsService.addUsersToOrganizationUnit(UsersToOrganizationUnitInput.fromJS({
                    userIds: [this.userId],
                    organizationUnitId: event.itemData.id
                }))
                : this.userOrgUnitsService.removeUserFromOrganizationUnit(this.userId, event.itemData.id)
            ).pipe(finalize(() => this.loadingService.finishLoading())).subscribe(() => {
                this.contactsService.orgUnitsSave(this.getSelectedOrganizationUnits());
                this.notifyService.info(this.ls.l('SavedSuccessfully'));
            });
        else if (event.event) {
            if (this.selectionMode == 'single') {
                if (this.lastSelectedItemId == event.itemData.id) {
                    if (!event.itemData.selected)
                        event.component.selectItem(event.node.key);
                } else {
                    this.lastSelectedItemId = event.itemData.id;
                    this.contactsService.orgUnitsSave(this.getSelectedOrganizationUnits());
                }
            } else {
                this.contactsService.orgUnitsSave(this.getSelectedOrganizationUnits());
            }
        }
    }

    saveToClipboard(event, value: string) {
        event.preventDefault();
        event.stopPropagation();
        this.clipboardService.copyFromContent(value);
        this.notifyService.info(this.ls.l('SavedToClipboard'));
    }

    ngOnDestroy() {
        this.contactsService.unsubscribe(this.ident);
    }
}
