/** Core imports */
import { Component, AfterViewInit, OnDestroy, Injector, ViewChild } from '@angular/core';

/** Third party imports */
import { DxSchedulerComponent } from 'devextreme-angular';
import { MatDialog } from '@angular/material';
import * as moment from 'moment';
import buildQuery from 'odata-query';

/** Application imports */
import { AppService } from '@app/app.service';
import { AppConsts } from '@shared/AppConsts';
import { PipelineComponent } from '@app/shared/pipeline/pipeline.component';
import { PipelineService } from '@app/shared/pipeline/pipeline.service';
import { DataLayoutType } from '@app/shared/layout/data-layout-type';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { AppComponentBase } from '@shared/common/app-component-base';
import { ActivityServiceProxy, CreateActivityDtoType } from '@shared/service-proxies/service-proxies';
import { CreateActivityDialogComponent } from './create-activity-dialog/create-activity-dialog.component';

@Component({
    templateUrl: './activity.component.html',
    styleUrls: ['./activity.component.less'],
    animations: [appModuleAnimation()],
    providers: [ ActivityServiceProxy ]
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
            fieldExpr: 'Type',
            useColorAsDefault: true,
            allowMultiple: false,
            dataSource: [{
                  text: this.l('Event'),
                  id: CreateActivityDtoType.Event,
                  color: '#727bd2'
              }, {
                  text: this.l('Task'),
                  id: CreateActivityDtoType.Task,
                  color: '#32c9ed'
            }],
            label: this.l('Type')
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
                lable: 'AddNewTask'
            }
        ]
    };

    constructor(
        injector: Injector,
        public dialog: MatDialog,
        private _pipelineService: PipelineService,
        private _appService: AppService
    ) {
        super(injector);

        this.localizationSourceName = AppConsts.localization.CRMLocalizationSourceName;

        this.headlineConfig.buttons.forEach((button) => {
            button.lable = this.l(button.lable);
        });

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
                url: this.getODataUrl(this.dataSourceURI),
                version: AppConsts.ODataVersion,
                beforeSend: (request) => {
                    this.startLoading();
                    request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                    let customize = ['DELETE', 'PATCH'].indexOf(request.method);
                    if (customize >= 0) {
                        if (customize)
                            request.method = 'PUT';
                        let endpoint = this.parseODataURL(request.url);
                        request.url = endpoint.url + 'api/services/CRM/Activity/'
                            + (customize ? 'Update' : 'Delete?Id=' + endpoint.id);
                    } else {
                        request.params.$filter = buildQuery(
                            {
                                filter: [
//                                    {AssignedUserIds: {any: {Id: this.appSession.userId}}},
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
    }

    parseODataURL(url) {
        let parts = url.split('odata');
        return {
            id: parts.pop().replace(/\D/g, ''),
            url: parts.pop()
        };
    }

    getCurrentDate() {
        let date = new Date(this.currentDate);
        date.setTime(date.getTime() - (date.getTimezoneOffset() * 60 * 1000));
        return moment.utc(date);
    }

    getPeriodType() {
        return this.currentView == 'agenda' ? 'day' : this.currentView;
    }

    getStartDate() {
        let period = <any>this.getPeriodType();
        return this.getCurrentDate().startOf(period)
            .add(period == 'month' ? -10: 0, 'days').toDate();
    }

    getEndDate() {
        let period = <any>this.getPeriodType();
        return this.getCurrentDate().endOf(period)
            .add(period == 'month' ? 10: 0, 'days').toDate();
    }

    initToolbarConfig() {
        this._appService.updateToolbar([
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
            },
            {
                location: 'after',
                locateInMenu: 'auto',
                items: [
                    {
                        name: 'fullscreen',
                        action: () => {
                            this.toggleFullscreen(document.documentElement);                          
                            !this.showPipeline && setTimeout(() => {                                  
                                this.schedulerComponent.instance.repaint();
                            }, 100);
                        }
                    }
                ]
            }
        ]);
    }

    onContentReady($event) {
        //!!VP this part fix scroll appearance for month view
        setTimeout(() => this.finishLoading(), 2000);
/*
        if (this.currentView == 'month')
            setTimeout(() => {
                let scroll = $event.element.getElementsByClassName('dx-scrollable-content')[0];
                if (scroll) {
                    scroll.classList.remove('dx-scheduler-scrollable-fixed-content');
                }
                $event.component.getWorkSpaceScrollable().update();
            }, 100);
*/
    }

    onAppointmentFormCreated(event) {
        event.component.hideAppointmentPopup(false);
        this.showActivityDialog(event.appointmentData);
    }

    toggleDataLayout(dataLayoutType) {
        let showPipeline = (dataLayoutType == DataLayoutType.Pipeline);
        if (this.showPipeline != showPipeline) {
            this.dataLayoutType = dataLayoutType;
            if ((this.showPipeline = showPipeline) && !this.pipelineDataSource)
                this.pipelineDataSource = {
                    uri: this.dataSourceURI,
//                    customFilter: {AssignedUserIds: {any: {Id: this.appSession.userId}}},
                    requireTotalCount: true,
                    store: {
                        key: 'Id',
                        type: 'odata',
                        url: this.getODataUrl(this.dataSourceURI),
                        version: AppConsts.ODataVersion,
                        beforeSend: function (request) {
                            request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                        },
                        paginate: true
                    }
                };

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
                } : appointment,
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
        this.activityStagesLoad();
    }

    deactivate() {
        this._appService.updateToolbar(null);
        this.rootComponent.overflowHidden();
    }

    ngAfterViewInit(): void {
        this.rootComponent = this.getRootComponent();
        this.activate();
    }

    ngOnDestroy() {
        this.deactivate();
    }

    activityStagesLoad() {
        this._pipelineService.getPipelineDefinitionObservable(AppConsts.PipelinePurposeIds.activity)
            .subscribe(result => {
                this.stages = result.stages.map((stage) => {
                    return {
                        id: stage.id,
                        name: stage.name,
                        text: stage.name
                    };
                });
            });
    }
}
