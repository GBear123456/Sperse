/** Core imports */
import { Component, AfterViewInit, OnDestroy, Injector, ViewChild } from '@angular/core';
import { Router } from '@angular/router';

/** Third party imports */
import { DxSchedulerComponent } from 'devextreme-angular';
import DataSource from 'devextreme/data/data_source';
import { MatDialog } from '@angular/material';
import { forkJoin } from 'rxjs';
import * as _ from 'underscore';
import * as moment from 'moment';

/** Application imports */
import { AppService } from '@app/app.service';
import { AppConsts } from '@shared/AppConsts';
import { PipelineComponent } from '@app/shared/pipeline/pipeline.component';
import { DataLayoutType } from '@app/shared/layout/data-layout-type';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { AppComponentBase } from '@shared/common/app-component-base';
import { PipelineService } from '@app/shared/pipeline/pipeline.service';
import { UserServiceProxy, ActivityServiceProxy, CreateActivityDto, 
    CreateActivityDtoType, UpdateActivityDto, PipelineDto } from '@shared/service-proxies/service-proxies';

import { CreateActivityDialogComponent } from './create-activity-dialog/create-activity-dialog.component';

import buildQuery from 'odata-query';

@Component({
    templateUrl: './activity.component.html',
    styleUrls: ['./activity.component.less'],
    animations: [appModuleAnimation()],
    providers: [ActivityServiceProxy]
})
export class ActivityComponent extends AppComponentBase implements AfterViewInit, OnDestroy {
    @ViewChild(DxSchedulerComponent) schedulerComponent: DxSchedulerComponent;
    @ViewChild(PipelineComponent) pipelineComponent: PipelineComponent;

    private rootComponent: any;
    private dataLayoutType: DataLayoutType = DataLayoutType.Grid;
    private dataSourceURI = 'Activity';
    private stages: any;
  
    public timezone: string;
    public showPipeline = false;
    public pipelineDataSource: any;
    public pipelinePurposeId = 
        AppConsts.PipelinePurposeIds.activity;
  
    public selectedLeads: any = [];
    public currentDate = new Date();
    public currentView = 'month';
    public resources: any[] = [
        {
            fieldExpr: "Type",
            useColorAsDefault: true,
            allowMultiple: false,
            dataSource: [{
                  text: this.l('Event'),
                  id: CreateActivityDtoType.Event,
                  color: "#727bd2"
              }, {
                  text: this.l('Task'),
                  id: CreateActivityDtoType.Task,
                  color: "#32c9ed"
            }],
            label: this.l("Type")
        }
    ];
    public headlineConfig = {
        names: [this.l('Tasks')],
        onRefresh: this.refresh.bind(this),
        icon: 'docs',
        buttons: [
            {
                enabled: true,
                action: () => { 
                    this.showActivityDialog(new Date());
                },
                lable: this.l('AddNewTask')
            }
        ]
    };

    constructor(injector: Injector, 
        private _router: Router,
        public dialog: MatDialog,
        private _appService: AppService,
        private _activityProxy: ActivityServiceProxy,
        private _pipelineService: PipelineService,
        private _userServiceProxy: UserServiceProxy
    ) {
        super(injector);

        this.localizationSourceName = AppConsts.localization.CRMLocalizationSourceName;

        if (abp.clock.provider.supportsMultipleTimezone)
            this.timezone = abp.timing.timeZoneInfo.iana.timeZoneId;

        this.initDataSource();
    }

    initDataSource() {
        this.dataSource = {
            requireTotalCount: false,
            store: {
                key: 'Id',
                type: 'odata',
                url: this.getODataURL(this.dataSourceURI),
                version: this.getODataVersion(),
                beforeSend: (request) => {
                    this.startLoading();
                    request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();                
                    let customize = ['DELETE', 'PATCH'].indexOf(request.method);
                    if (customize >= 0) {
                        if (customize)
                            request.method = 'PUT';
                        let endpoint = this.parseODataURL(request.url); 
                        request.url = endpoint.url + 'api/services/CRM/Activity/' 
                            + (customize ? 'Update': 'Delete?Id=' + endpoint.id);
                    } else {                         
                        request.params.$filter = buildQuery(
                            { 
                                filter: [
                                    {AssignedUserIds: {any: {Id: this.appSession.userId}}},
                                    {
                                        or: [
                                            {and: [{StartDate: {le: this.getEndDate()}}, {EndDate: {ge: this.getStartDate()}}]}
                                        ]
                                    }
                                ]
                            }
                        ).split('=').pop();
                    }
                },
                paginate: false
            }
        };

        this.pipelineDataSource = {
            uri: this.dataSourceURI,
            customFilter: {AssignedUserIds: {any: {Id: this.appSession.userId}}},
            requireTotalCount: true,
            store: {
                key: 'Id',
                type: 'odata',
                url: this.getODataURL(this.dataSourceURI),
                version: this.getODataVersion(),
                beforeSend: function (request) {
                    request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                },
                paginate: true
            }
        };
    }

    parseODataURL(url) {
        let parts = url.split('odata');
        return {
            id: parts.pop().replace(/\D/g, ''),
            url: parts.pop()
        }            
    }

    getCurrentDate() {
        let date = new Date(this.currentDate);
        date.setTime(date.getTime() - (date.getTimezoneOffset() * 60 * 1000));
        return moment.utc(date);
    }

    getPeriodType() {
        return this.currentView == 'agenda' ? 'day': this.currentView;
    }

    getStartDate() {
        return this.getCurrentDate().startOf(<any>this.getPeriodType()).toDate();
    }

    getEndDate() {
        return this.getCurrentDate().endOf(<any>this.getPeriodType()).toDate();
    }

    initToolbarConfig() {
        this._appService.toolbarConfig = [
            {
                location: 'before', items: [
                    { 
                        name: 'back', 
                        action: Function()
                    }
                ]
            },
/*
            {
                location: 'before', items: [
                    {
                        widget: 'dxDateBox',
                        visible: !this.showPipeline,
                        options: {
                            acceptCustomValue: false,
                            adaptivityEnabled: true,
                            value: this.currentDate,
                            onValueChanged: (event) => {
                                this.currentDate = event.value;
                            }
                        }
                    }
                ]
            }, 
            {
                location: 'after', items: [
                    {
                        name: 'select-box',
                        visible: !this.showPipeline,
                        widget: 'dxDropDownMenu',
                        options: {
                            width: 120,
                            selectedIndex: this.currentView.length - 3,
                            onSelectionChanged: (event) => {
                                this.currentView = event.itemData.text.toLowerCase();
                            },
                            items: [
                                { text: this.l('Day') }, 
                                { text: this.l('Week') }, 
                                { text: this.l('Month') }, 
                                { text: this.l('Agenda') }
                            ]
                        }
                    }
                ]
            },
*/
            {
                location: 'after',
                areItemsDependent: true,
                items: [
                    {
                        name: 'pipeline',
                        action: this.toggleDataLayout.bind(this, DataLayoutType.Pipeline),
                        options: {
                            checkPressed: () => {
                                return (this.dataLayoutType == DataLayoutType.Pipeline);
                            },
                        }
                    },
                    {
                        name: 'grid',
                        action: this.toggleDataLayout.bind(this, DataLayoutType.Grid),
                        options: {
                            checkPressed: () => {
                                return (this.dataLayoutType == DataLayoutType.Grid);
                            },
                        }
                    }
                ]
            }
        ];
    }

    onContentReady($event) {
        //!!VP this part fix scroll appearance for month view
        setTimeout(() => this.finishLoading(), 2000);
        if (this.currentView == 'month')
            setTimeout(() => {
                let scroll = $event.element.getElementsByClassName('dx-scrollable-content')[0];
                if (scroll) {
                    scroll.classList.remove('dx-scheduler-scrollable-fixed-content');
                }
                $event.component.getWorkSpaceScrollable().update();
            }, 100);
    }

    onAppointmentFormCreated(event) {
        event.component.hideAppointmentPopup(false);
        this.showActivityDialog(event.appointmentData);
    }

    toggleDataLayout(dataLayoutType) {
        let showPipeline = (dataLayoutType == DataLayoutType.Pipeline);
        if (this.showPipeline != showPipeline) {
            this.dataLayoutType = dataLayoutType;
            this.showPipeline = showPipeline;
            this.initToolbarConfig();
        }
    }

    showActivityDialog(appointment) {
        this.schedulerComponent.instance.hideAppointmentTooltip();
        this.dialog.open(CreateActivityDialogComponent, {
            panelClass: 'slider',
            disableClose: true,
            closeOnNavigation: false,
            data: {
                stages: this.stages,
                appointment: appointment instanceof Date ? {
                    startDate: appointment
                }: appointment,
                refreshParent: this.refresh.bind(this)
            }
        });
    }

    refresh(quietly = false, stageId) {
        this.schedulerComponent.instance.repaint();
        this.pipelineComponent.refresh(
            quietly || !this.showPipeline, stageId);
    }

    activate() {
        this.rootComponent.overflowHidden(true);
        this.initToolbarConfig();
    }

    deactivate() {
        this._appService.toolbarConfig = null;
        this.rootComponent.overflowHidden();
    }

    ngAfterViewInit(): void {
        this.rootComponent = this.getRootComponent();
        this.activate();
    }

    ngOnDestroy() {
        this.deactivate();
    }

    onStagesLoaded($event) {
        this.stages = $event.stages;
    }
}