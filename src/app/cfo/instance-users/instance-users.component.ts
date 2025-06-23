/** Core imports */
import { Component, Injector, OnInit, AfterViewInit, OnDestroy, ViewChild } from '@angular/core';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import DataSource from 'devextreme/data/data_source';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { finalize } from 'rxjs/operators';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { AppService } from '@app/app.service';
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import { AddInstanceUserDialogComponent } from './add-instance-user-dialog/add-instance-user-dialog.component';
import { SynchProgressComponent } from '@shared/cfo/bank-accounts/synch-progress/synch-progress.component';
import { InstanceServiceProxy, AddUserInput } from '@shared/service-proxies/service-proxies';
import { DataGridService } from '@app/shared/common/data-grid.service/data-grid.service';
import { ToolbarGroupModel } from '@app/shared/common/toolbar/toolbar.model';

@Component({
    templateUrl: './instance-users.component.html',
    styleUrls: ['./instance-users.component.less']
})
export class InstanceUsersComponent extends CFOComponentBase implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild(SynchProgressComponent, { static: true }) synchProgressComponent: SynchProgressComponent;
    @ViewChild(DxDataGridComponent, { static: true }) dataGrid: DxDataGridComponent;

    formatting = AppConsts.formatting;
    contacts = [];
    toolbarConfig: ToolbarGroupModel[];

    constructor(
        injector: Injector,
        private dialog: MatDialog,
        private instanceProxy: InstanceServiceProxy,
        public appService: AppService
    ) {
        super(injector);
        this.dataSource = new DataSource({
            key: 'userId',
            load: () => {
                this.startLoading();
                this.isDataLoaded = false;
                return this.instanceProxy.getUsers(this.instanceType, this.instanceId).pipe(
                    finalize(() => this.finishLoading())
                ).toPromise().then(response => {
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
        this.toolbarConfig = [
            {
                location: 'after',
                locateInMenu: 'auto',
                items: [
                    {
                        name: 'add',
                        action: this.showAddInstanceUserDialog.bind(this)
                    },
                    {
                        name: 'delete',
                        disabled: this.dataGrid.instance && this.dataGrid.instance.getSelectedRowKeys().length != 1,
                        action: this.deleteSelectUser.bind(this)
                    }
                ]
            }
        ];
    }

    showAddInstanceUserDialog() {
        this.dialog.open(AddInstanceUserDialogComponent, {
            maxWidth: '430px',
            data: {
                exceptUserIds: this.dataGrid.instance.getVisibleRows().map(item => item.data.userId)
            }
        }).afterClosed().subscribe(result => {
            if (result && result.userId) {
                this.startLoading();
                this.instanceProxy.addUser(this.instanceType, this.instanceId, new AddUserInput(result)).pipe(
                    finalize(() => this.finishLoading())
                ).subscribe(() => {
                    this.invalidate();
                    this.notify.info(this.l('SavedSuccessfully'));
                });
            }
        });
    }

    deleteSelectUser() {
        this.startLoading();
        this.instanceProxy.removeUser(this.instanceType, this.instanceId, this.dataGrid.instance.getSelectedRowKeys()[0]).pipe(
            finalize(() => this.finishLoading())
        ).subscribe(() => {
            this.invalidate();
            this.notify.info(this.l('SuccessfullyDeleted'));
        });
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
        this.synchProgressComponent.deactivate();
        this.getRootComponent().overflowHidden();
    }
}