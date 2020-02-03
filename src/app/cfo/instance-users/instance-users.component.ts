/** Core imports */
import { Component, Injector, OnInit, AfterViewInit, OnDestroy, ViewChild } from '@angular/core';

/** Third party imports */
import DataSource from 'devextreme/data/data_source';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { finalize } from 'rxjs/operators';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { AppService } from '@app/app.service';
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import { StaticListComponent } from '@app/shared/common/static-list/static-list.component';
import { SynchProgressComponent } from '@shared/cfo/bank-accounts/synch-progress/synch-progress.component';
import { InstanceServiceProxy, ContactServiceProxy } from '@shared/service-proxies/service-proxies';
import { DataGridService } from '@app/shared/common/data-grid.service/data-grid.service';
import { AdAutoLoginHostDirective } from '../../../account/auto-login/auto-login.component';

@Component({
    templateUrl: './instance-users.component.html',
    styleUrls: ['./instance-users.component.less']
})
export class InstanceUsersComponent extends CFOComponentBase implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild(SynchProgressComponent, { static: true }) synchProgressComponent: SynchProgressComponent;
    @ViewChild('userAssignList', { static: true }) userAssignList: StaticListComponent;
    @ViewChild(DxDataGridComponent, { static: true }) dataGrid: DxDataGridComponent;

    currentUserId = abp.session.userId;
    formatting = AppConsts.formatting;
    lastSearch: string;
    lookupTimeout;
    contacts = [];

    constructor(
        private injector: Injector,
        private appService: AppService,
        private instanceProxy: InstanceServiceProxy,
        private contactProxy: ContactServiceProxy
    ) {
        super(injector);

        this.dataSource = new DataSource({
            key: 'userId',
            load: (loadOptions) => {
                this.startLoading();
                this.isDataLoaded = false;
                return this.instanceProxy.getUsers(this.instanceType, this.instanceId
                ).pipe(finalize(() => this.finishLoading())).toPromise().then(response => {                    
                    return {
                        data: response,
                        totalCount: response.length
                    };
                });
            }
        });
    }

    ngOnInit(): void {
        this.activate();        
    }

    ngAfterViewInit(): void {
        DataGridService.toggleCompactRowsHeight(this.dataGrid);
        let rootComponent = this.getRootComponent();
        rootComponent.overflowHidden(true);
    }

    toggleToolbar() {
        this.appService.toolbarToggle();
        setTimeout(() => this.dataGrid.instance.repaint());
    }

    initToolbarConfig() {
        this.appService.updateToolbar([
            {
                location: 'before',
                locateInMenu: 'auto',
                items: [
                    {
                        name: 'assign',
                        action: event => {
                            if (!this.contacts.length)
                                this.contactLookupRequest();
                            this.userAssignList.toggle();
                        }
                        //disabled: !this.contactService.checkCGPermission(ContactGroup.Client, 'ManageAssignments'),
                    },
                    {
                        name: 'delete',
                        action: Function
                    }
                ]
            }
        ]);
    }

    expandColapseRow(e) {
        if (!e.data.sourceData) return;

        if (e.isExpanded) {
            e.component.collapseRow(e.key);
        } else {
            e.component.expandRow(e.key);
        }
    }

    onItemSelected(event) {
console.log('onItemSelected', event);
    }

    onSourceFiltered(event) {
console.log('onSourceFiltered', event);
    }

    onOptionChanged(event) {
console.log('onOptionChanged', event);
    }

    contactLookupRequest(phrase = '', callback?) {
        this.contactProxy.getAllByPhrase(phrase, 10).subscribe(res => {
            if (!phrase || phrase == this.lastSearch) {
                this.contacts = res;
                this.userAssignList.dxList.instance.repaint();
                callback && callback(res);
            }
        });
    }

    customerLookupItems($event) {
        let search = $event.event.target.value;
        if (this.contacts.length)
            this.contacts = [];

        $event.component.option('opened', true);
        $event.component.option('noDataText', this.l('LookingForItems'));

        clearTimeout(this.lookupTimeout);
        this.lookupTimeout = setTimeout(() => {
            $event.component.option('opened', true);
            $event.component.option('noDataText', this.l('LookingForItems'));

            this.contactLookupRequest(search, res => {
                if (!res['length'])
                    $event.component.option('noDataText', this.l('NoItemsFound'));
            });
        }, 500);
    }

    ngOnDestroy() {
        this.deactivate();
        super.ngOnDestroy();
    }

    activate() {
        this.initToolbarConfig();
        this.synchProgressComponent.activate();
        this.getRootComponent().overflowHidden(true);
    }

    deactivate() {
        this.appService.updateToolbar(null);
        this.synchProgressComponent.deactivate();
        this.getRootComponent().overflowHidden();
    }
}