/** Core imports */
import { Component, Injector, OnInit, AfterViewInit, OnDestroy, ViewChild } from '@angular/core';
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import { AppConsts } from '@shared/AppConsts';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import { Store, select } from '@ngrx/store';
import DataSource from 'devextreme/data/data_source';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import * as moment from 'moment';
import { Observable, Subject, combineLatest, of } from 'rxjs';
import {
    catchError,
    finalize,
    filter,
    first,
    tap,
    startWith,
    switchMap,
    map,
    mapTo,
    takeUntil,
    publishReplay,
    refCount
} from 'rxjs/operators';
import cloneDeep from 'lodash/cloneDeep';

/** Application imports */
import { AppService } from '@app/app.service';
import { SynchProgressComponent } from '@shared/cfo/bank-accounts/synch-progress/synch-progress.component';
import { BankAccountsService } from '@shared/cfo/bank-accounts/helpers/bank-accounts.service';
import { BankAccountFilterComponent } from '@shared/filters/bank-account-filter/bank-account-filter.component';
import { BankAccountFilterModel } from '@shared/filters/bank-account-filter/bank-account-filter.model';
import { FiltersService } from '@shared/filters/filters.service';
import { FilterModel } from '@shared/filters/models/filter.model';
import {
    InstanceType,
    InstanceServiceProxy
} from '@shared/service-proxies/service-proxies';
import { FilterHelpers } from '../shared/helpers/filter.helper';
import { CfoStore, ForecastModelsStoreActions, ForecastModelsStoreSelectors } from '@app/cfo/store';
import { RootStore, CurrenciesStoreSelectors } from '@root/store';
import { CfoPreferencesService } from '@app/cfo/cfo-preferences.service';
import { BankAccountsSelectDialogComponent } from '@app/cfo/shared/bank-accounts-select-dialog/bank-accounts-select-dialog.component';
import { LifecycleSubjectsService } from '@shared/common/lifecycle-subjects/lifecycle-subjects.service';
import { CalendarValuesModel } from '@shared/common/widgets/calendar/calendar-values.model';
import { FilterCalendarComponent } from '@shared/filters/calendar/filter-calendar.component';
import { FilterItemModel } from '@shared/filters/models/filter-item.model';
import { DataGridService } from '@app/shared/common/data-grid.service/data-grid.service';

@Component({
    templateUrl: './instance-users.component.html',
    styleUrls: ['./instance-users.component.less'],
    providers: [ LifecycleSubjectsService ]
})
export class InstanceUsersComponent extends CFOComponentBase implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;
    @ViewChild(SynchProgressComponent) synchProgressComponent: SynchProgressComponent;

    constructor(
        private injector: Injector,
        private dialog: MatDialog,
        private appService: AppService,
        private instanceProxy: InstanceServiceProxy,
        private lifecycleService: LifecycleSubjectsService
    ) {
        super(injector);

        this.dataSource = new DataSource({
            key: 'id',
            load: (loadOptions) => {
                this.isDataLoaded = false;
                return this.instanceProxy.getUsers(
                    this.instanceType, this.instanceId
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

/*
    openDialog() {
        this.dialog.open(Object, {
            panelClass: 'slider',
        }).componentInstance.onApply.subscribe(() => {

        });
    }
*/
    expandColapseRow(e) {
        if (!e.data.sourceData) return;

        if (e.isExpanded) {
            e.component.collapseRow(e.key);
        } else {
            e.component.expandRow(e.key);
        }
    }

    ngOnDestroy() {
        this.deactivate();
        super.ngOnDestroy();
    }

    activate() {
        /** Load sync accounts (if something change - subscription in ngOnInit fires) */
        this.lifecycleService.activate.next();
        this.synchProgressComponent.activate();
        this.getRootComponent().overflowHidden(true);
    }

    deactivate() {
        this.dialog.closeAll();
        this.appService.updateToolbar(null);
        this.synchProgressComponent.deactivate();
        this.getRootComponent().overflowHidden();
    }
}