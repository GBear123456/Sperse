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

    public timezone: string = 'Etc/UTC';
    public showPipeline = false;
    public pipelineDataSource: any;
    public pipelinePurposeId =
        AppConsts.PipelinePurposeIds.activity;

    public activityTypes = CreateActivityDtoType;
    public selectedLeads: any = [];

    public currentDate = new Date();
    public scheduleDate = new Date(this.currentDate);
    private pipelineDate = new Date(this.currentDate);
    private calendarCaption: string;
    public calendarInitialized: boolean = false;

    private currentView = 'month';
    private pipelineView = this.currentView;
    public scheduleView = this.currentView;

    public popoverCalendarVisible: boolean = false;
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

        this.updateCalendarCaption();
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
                            request.method = 'POST';
                        let endpoint = this.parseODataURL(request.url);
                        request.url = endpoint.url + 'api/services/CRM/Activity/'
                            + (customize ? 'Move' : 'Delete?Id=' + endpoint.id);
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
                deserializeDates: false,
                onLoaded: (res) => {
                    res.forEach((record) => {
                        record.fieldTimeZone = 'Etc/UTC';
                    });
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
        if (!this.currentView) {
            return 'month';
        }

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
                location: 'before',
                areItemsDependent: true,
                items: [
                    {
                        name: 'calendar-navigator-left',
                        widget: 'dxButton',
                        options: {
                            icon: 'chevronprev'
                        },
                        action: () => {
                            this.updateCurrentDate(-1);
                        }
                    },
                    {
                        name: 'calendar-navigator-body',
                        widget: 'dxButton',
                        options: {
                            text: this.calendarCaption
                        },
                        action: () => {
                            this.popoverCalendarVisible = true;
                        },
                        attr: {
                            'id': 'calendar-navigator-body'
                        }
                    },
                    {
                        name: 'calendar-navigator-right',
                        widget: 'dxButton',
                        options: {
                            icon: 'chevronnext'
                        },
                        action: () => {
                            this.updateCurrentDate(1);
                        }
                    },
                ]
            },
            {
                location: 'after',
                areItemsDependent: true,
                items: [
                    {
                        name: 'Day',
                        widget: 'dxButton',
                        options: {
                            text: 'Day',
                            checkPressed: () => {
                                return (this.currentView == 'day');
                            }
                        },
                        action: () => {
                            this.onViewChanged('day');
                        }
                    },
                    {
                        name: 'Week',
                        widget: 'dxButton',
                        options: {
                            text: 'Week',
                            checkPressed: () => {
                                return (this.currentView == 'week');
                            }
                        },
                        action: () => {
                            this.onViewChanged('week');
                        }
                    },
                    {
                        name: 'Month',
                        widget: 'dxButton',
                        options: {
                            text: 'Month',
                            checkPressed: () => {
                                return (this.currentView == 'month');
                            }
                        },
                        action: () => {
                            this.onViewChanged('month');
                        }
                    },
                    {
                        name: 'Agenda',
                        widget: 'dxButton',
                        options: {
                            text: 'Agenda',
                            checkPressed: () => {
                                return (this.currentView == 'agenda');
                            }
                        },
                        action: () => {
                            this.onViewChanged('agenda');
                        }
                    }
                ]
            },
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
            this.showPipeline = showPipeline;
            if (this.showPipeline) {
                if (!this.pipelineDataSource || this.pipelineView != this.currentView || this.pipelineDate != this.currentDate) {
                    this.pipelineView = this.currentView;
                    this.pipelineDate = new Date(this.currentDate);
                    this.setPipelineDataSource(!!this.pipelineDataSource);
                }
            }
            else {
                this.schedulerComponent.instance.option('dataSource', null);
                if (!this.currentView) {
                    this.scheduleView = this.currentView = 'month';
                    this.updateCalendarCaption();
                }
                else if (this.scheduleView != this.currentView)
                    this.scheduleView = this.currentView;

                if (this.scheduleDate != this.currentDate)
                    this.scheduleDate = new Date(this.currentDate);

                //this is done to prevent double data retrieving after settings scheduleView and scheduleDate
                setTimeout(() => this.schedulerComponent.instance.option('dataSource', this.dataSource))
            }

            this.initToolbarConfig();
        }
    }

    setPipelineDataSource(refresh: boolean = true) {
        let dataSource = {
            uri: this.dataSourceURI,
            requireTotalCount: true,
            store: {
                key: 'Id',
                type: 'odata',
                url: this.getODataUrl(this.dataSourceURI),
                version: AppConsts.ODataVersion,
                beforeSend: function (request) {
                    request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                },
                deserializeDates: false,
                paginate: true
            }
        };
        if (this.pipelineView)
            dataSource['customFilter'] = { and: [{ StartDate: { le: this.getEndDate() } }, { EndDate: { ge: this.getStartDate() } }] }

        this.pipelineDataSource = dataSource;

        if (refresh)
            this.pipelineComponent.refresh();
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

    repaint() {
        let instance = this.schedulerComponent.instance,
            initialHeight = instance.option('height');
    
        instance.option('height', '0px');
        setTimeout(() => instance.option('height', initialHeight));
    }

    activate() {
        this._appService.hideSubscriptionCallback = () => {
            if (!this.showPipeline)
                this.repaint();
        };

        this.rootComponent.overflowHidden(true);
        this.initToolbarConfig();
        this.activityStagesLoad();
    }

    deactivate() {
        this._appService.hideSubscriptionCallback = null;

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

    deleteAppointment(appointment) {
        this.schedulerComponent.instance.deleteAppointment(appointment);
    }

    onAppointmentDeleted() {
        this.schedulerComponent.instance.hideAppointmentTooltip();
    }

    getDateWithTimezone(value) {
        return new Date(moment(value).format('YYYY-MM-DD HH:mm:ss'));
    }    

    onAppointmentUpdating(event) {
        let period = <any>this.getPeriodType();
        if (period == 'month') {
            const delimiter = 'T';
            let diff = moment(event.newData.StartDate).diff(event.oldData.StartDate, 'days'),
                newDateParts = event.newData.StartDate.split(delimiter),
                oldDateParts = event.oldData.StartDate.split(delimiter); 
            event.newData.StartDate = newDateParts.shift() + delimiter + oldDateParts.pop();

            let endDate = moment(event.oldData.EndDate).add(diff, 'days').format('YYYY-MM-DDTHH:mm:ss');
            newDateParts = endDate.split(delimiter);
            oldDateParts = event.oldData.EndDate.split(delimiter); 
            event.newData.EndDate = newDateParts.shift() + delimiter + oldDateParts.pop();
        }
    }

    onViewChanged(view: string) {
        if (this.showPipeline && this.currentView == view)
            this.currentView = null;
        else
            this.currentView = view;

        if (this.showPipeline) {
            this.pipelineView = this.currentView;
            this.setPipelineDataSource();
        }
        else {
            this.scheduleView = this.currentView;
        }

        this.updateCalendarCaption();
        this.initToolbarConfig();
    }

    currentDateChange() {
        if (this.showPipeline) {
            this.pipelineDate = new Date(this.currentDate);
            if (this.pipelineView)
                this.setPipelineDataSource();
        }
        else {
            this.scheduleDate = new Date(this.currentDate);
        }

        this.updateCalendarCaption();
        this.initToolbarConfig();
        this.popoverCalendarVisible = false;
    }

    updateCurrentDate(direction: 1 | -1) {
        let newDate = new Date(this.currentDate);
        switch (this.currentView) {
            case 'agenda':
            case 'day':
                newDate.setDate(newDate.getDate() + direction);
                break;
            case 'week':
                newDate.setDate(newDate.getDate() + (direction * 7));
                break;
            case 'month':
                newDate.setMonth(newDate.getMonth() + direction);
                break;
        }

        this.currentDate = newDate;
        if (!this.calendarInitialized)
            this.currentDateChange();
    }

    updateCalendarCaption() {
        switch (this.currentView) {
            case 'agenda':
            case 'day':
                this.calendarCaption = moment(this.currentDate).format("D MMMM YYYY");
                break;
            case 'week':
                let momentDate = moment(this.currentDate);
                let weekStart = moment(this.currentDate).startOf("week");
                let weekEnd = moment(this.currentDate).endOf("week");
                if (weekStart.month() == momentDate.month() && weekEnd.month() == momentDate.month()) {
                    this.calendarCaption = `${weekStart.date()} - ${weekEnd.date()} ${momentDate.format("MMMM YYYY")}`;
                }
                else {
                    this.calendarCaption = `${weekStart.date()} ${weekStart.format("MMM")} - ${weekEnd.date()} ${weekEnd.format("MMM")} ${weekEnd.year()}`
                }
                break;
            case 'month':
                this.calendarCaption = moment(this.currentDate).format("MMMM YYYY");
                break;
            default:
                this.calendarCaption = 'All period';
        }
    }
}
