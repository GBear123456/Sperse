import { Component, AfterViewInit, Injector, ElementRef, ViewChild, ViewEncapsulation } from '@angular/core';
import {
    HostDashboardServiceProxy,
    HostDashboardData,
} from '@shared/service-proxies/service-proxies';
import { AppComponentBase } from '@shared/common/app-component-base';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import * as moment from 'moment';
import { DateTimeService } from '@app/shared/common/timing/date-time.service';
import { AppIncomeStatisticsDateInterval } from '@shared/AppEnums';
import { JTableHelper } from '@shared/helpers/JTableHelper';

@Component({
    templateUrl: './host-dashboard.component.html',
    styleUrls: ['./host-dashboard.component.less'],
    encapsulation: ViewEncapsulation.None,
    animations: [appModuleAnimation()]
})
export class HostDashboardComponent extends AppComponentBase implements AfterViewInit {
    @ViewChild('DashboardDateRangePicker') dateRangePickerElement: ElementRef;
    @ViewChild('EditionStatisticsChart') editionStatisticsChart: ElementRef;
    @ViewChild('IncomeStatisticsChart') incomeStatisticsChart: ElementRef;
    @ViewChild('RecentTenantsTable') recentTenantsTable: ElementRef;
    @ViewChild('ExpiringTenantsTable') expiringTenantsTable: ElementRef;

    loading: boolean = false;
    loadingIncomeStatistics: boolean = false;
    isInitialized: boolean;
    hostDashboardData: HostDashboardData;
    initialStartDate: moment.Moment = moment().add(-7, 'days').startOf('day');
    initialEndDate: moment.Moment = moment().endOf('day');
    currency = '$';
    appIncomeStatisticsDateInterval = AppIncomeStatisticsDateInterval;
    selectedIncomeStatisticsDateInterval: any;
    editionStatisticsHasData: boolean;
    incomeStatisticsHasData: boolean;
    selectedDateRange = {
        startDate: this.initialStartDate,
        endDate: this.initialEndDate
    };

    private _$editionsTable: JQuery;
    private _expiringTenantsData = [];
    private _recentTenantsData = [];

    constructor(
        injector: Injector,
        private _dateTimeService: DateTimeService,
        private _hostDashboardService: HostDashboardServiceProxy
    ) {
        super(injector);
    }

    init(): void {
        this.selectedIncomeStatisticsDateInterval = AppIncomeStatisticsDateInterval.Daily;
    }

    ngOnInit(): void {
        this.init();
    }

    ngAfterViewInit(): void {
        setTimeout(() => {
            this.createDateRangePicker();
            this.getDashboardStatisticsData();
            this.bindToolTipForIncomeStatisticsChart($(this.incomeStatisticsChart.nativeElement));
            this.initRecentTenantsTable();
            this.initExpiringTenantsTable();
        });
    }

    createDateRangePicker(): void {
        $(this.dateRangePickerElement.nativeElement)
            .daterangepicker(
            $.extend(true, this._dateTimeService.createDateRangePickerOptions(), this.selectedDateRange),
            (start, end, label) => {
                this.selectedDateRange.startDate = start;
                this.selectedDateRange.endDate = end;
                this.getDashboardStatisticsData();
            });
    }

    getDashboardStatisticsData(): void {
        this.loading = true;
        this._hostDashboardService
            .getDashboardStatisticsData(
            this.selectedIncomeStatisticsDateInterval,
            this.selectedDateRange.startDate,
            this.selectedDateRange.endDate
            )
            .subscribe(result => {
                this.hostDashboardData = result;
                this.drawEditionStatisticsData(result.editionStatistics);
                this.drawIncomeStatisticsChart(result.incomeStatistics);
                this.loadRecentTenantsTable(result.recentTenants);
                this.loadExpiringTenantsTable(result.expiringTenants);
                this.loading = false;
            });
    }

    /*
    * Edition statistics pie chart
    */

    normalizeEditionStatisticsData(data): Array<any> {
        const colorPalette = ['#81A17E', '#BA9B7C', '#569BC6', '#e08283', '#888888'];
        let chartData = new Array(data.length);
        let pie: any;
        for (let i = 0; i < data.length; i++) {
            pie = {
                label: data[i].label,
                data: data[i].value
            };

            if (colorPalette[i]) {
                pie.color = colorPalette[i];
            }

            chartData[i] = pie;
        }

        return chartData;
    }

    drawEditionStatisticsData(data): void {
        this.editionStatisticsHasData = (data && data.length > 0);
        if (!this.editionStatisticsHasData) {
            return;
        }

        let self = this;
        const normalizedData = this.normalizeEditionStatisticsData(data);
        ($ as any).plot($(self.editionStatisticsChart.nativeElement), normalizedData, {
            series: {
                pie: {
                    show: true,
                    innerRadius: 0.3,
                    radius: 1,
                    label: {
                        show: true,
                        radius: 1,
                        formatter(label, series) {
                            return '<div class="pie-chart-label">' + label + ' : ' + Math.round(series.percent) + '%</div>';
                        },
                        background: {
                            opacity: 0.8
                        }
                    }
                }
            },
            legend: {
                show: false
            },
            grid: {
                hoverable: true,
                clickable: true
            }
        });
    }

    /*
     * Income statistics line chart
     */


    normalizeIncomeStatisticsData(data): Array<any> {
        let chartData = [];
        for (let i = 0; i < data.length; i++) {
            let point = new Array(2);
            point[0] = moment(data[i].date).utc().valueOf();
            point[1] = data[i].amount;
            chartData.push(point);
        }

        return chartData;
    }

    drawIncomeStatisticsChart(data): void {
        this.incomeStatisticsHasData = (data && data.length > 0);
        if (!this.incomeStatisticsHasData) {
            return;
        }

        let self = this;
        const normalizedData = this.normalizeIncomeStatisticsData(data);
        ($ as any).plot($(self.incomeStatisticsChart.nativeElement),
            [{
                data: normalizedData,
                lines: {
                    fill: 0.2,
                    lineWidth: 1
                },
                color: ['#BAD9F5']
            }, {
                data: normalizedData,
                points: {
                    show: true,
                    fill: true,
                    radius: 4,
                    fillColor: '#9ACAE6',
                    lineWidth: 2
                },
                color: '#9ACAE6',
                shadowSize: 1
            }, {
                data: normalizedData,
                lines: {
                    show: true,
                    fill: false,
                    lineWidth: 3
                },
                color: '#9ACAE6',
                shadowSize: 0
            }],
            {
                xaxis: {
                    mode: 'time',
                    timeformat: this.l('ChartDateFormat'),
                    minTickSize: [1, 'day'],
                    font: {
                        lineHeight: 20,
                        style: 'normal',
                        variant: 'small-caps',
                        color: '#6F7B8A',
                        size: 10
                    }
                },
                yaxis: {
                    ticks: 5,
                    tickDecimals: 0,
                    tickColor: '#eee',
                    font: {
                        lineHeight: 14,
                        style: 'normal',
                        variant: 'small-caps',
                        color: '#6F7B8A'
                    }
                },
                grid: {
                    hoverable: true,
                    clickable: false,
                    tickColor: '#eee',
                    borderColor: '#eee',
                    borderWidth: 1,
                    margin: {
                        bottom: 20
                    }
                }
            });
    }

    incomeStatisticsDateIntervalChange(event) {
        this.refreshIncomeStatisticsData();
    }

    refreshIncomeStatisticsData(): void {
        this.loadingIncomeStatistics = true;
        this._hostDashboardService.getIncomeStatistics(
            this.selectedIncomeStatisticsDateInterval,
            this.selectedDateRange.startDate,
            this.selectedDateRange.endDate)
            .subscribe(result => {
                this.drawIncomeStatisticsChart(result.incomeStatistics);
                this.loadingIncomeStatistics = false;
            });
    }

    bindToolTipForIncomeStatisticsChart(incomeStatisticsChartContainer: any): void {
        let incomeStatisticsChartLastTooltipIndex = null;

        let removeChartTooltipIfExists = () => {
            let $chartTooltip = $('#chartTooltip');
            if ($chartTooltip.length === 0) {
                return;
            }

            $chartTooltip.remove();
        };

        let showChartTooltip = (x, y, label, value) => {
            removeChartTooltipIfExists();
            $('<div id="chartTooltip" class="chart-tooltip">' + label + '<br/>' + value + '</div >')
                .css({
                    position: 'absolute',
                    display: 'none',
                    top: y - 60,
                    left: x - 40,
                    border: '0',
                    padding: '2px 6px',
                    opacity: '0.9'
                })
                .appendTo('body')
                .fadeIn(200);
        };

        incomeStatisticsChartContainer.bind('plothover', (event, pos, item) => {
            if (!item) {
                return;
            }

            if (incomeStatisticsChartLastTooltipIndex !== item.dataIndex) {
                let label = '';
                let isSingleDaySelected = this.selectedDateRange.startDate.format('L') === this.selectedDateRange.endDate.format('L');
                if (this.selectedIncomeStatisticsDateInterval === AppIncomeStatisticsDateInterval.Daily ||
                    isSingleDaySelected) {
                    label = moment(item.datapoint[0]).format('dddd, DD MMMM YYYY');
                }
                else {
                    let isLastItem = item.dataIndex === item.series.data.length - 1;
                    label += moment(item.datapoint[0]).format('LL');
                    if (isLastItem) {
                        label += ' - ' + this.selectedDateRange.endDate.format('LL');
                    } else {
                        let nextItem = item.series.data[item.dataIndex + 1];
                        label += ' - ' + moment(nextItem[0]).format('LL');
                    }
                }

                incomeStatisticsChartLastTooltipIndex = item.dataIndex;
                let value = this.l('IncomeWithAmount', '<strong>' + item.datapoint[1] + this.currency + '</strong>');
                showChartTooltip(item.pageX, item.pageY, label, value);
            }
        });

        incomeStatisticsChartContainer.bind('mouseleave', () => {
            incomeStatisticsChartLastTooltipIndex = null;
            removeChartTooltipIfExists();
        });
    }

    /*
     * Recent tenants
     */

    initRecentTenantsTable(): void {
        let self = this;
        $(this.recentTenantsTable.nativeElement).jtable({
            paging: false,
            sorting: false,
            multiSorting: false,
            actions: {
                listAction(postData, jtParams: JTableParams) {
                    return JTableHelper.toJTableListActionWithData(self._recentTenantsData, self._recentTenantsData.length, self._recentTenantsData);
                }
            },
            fields: {
                name: {
                    title: this.l('TenantName')
                },
                creationTime: {
                    title: this.l('CreationTime'),
                    display(data) {
                        return moment(data.record.creationTime).format('L LT');
                    }
                }
            }
        });
    }

    loadRecentTenantsTable(recentTenants): void {
        this._recentTenantsData = recentTenants;
        $(this.recentTenantsTable.nativeElement).jtable('load');
    }

    gotoAllRecentTenants(): void {
        window.open(abp.appPath + 'app/crm/tenants?' +
            'creationDateStart=' + encodeURIComponent(this.hostDashboardData.tenantCreationStartDate.format()));
    }

    /*
     * Expiring tenants
     */

    initExpiringTenantsTable(): void {
        let self = this;
        $(this.expiringTenantsTable.nativeElement).jtable({
            paging: false,
            sorting: false,
            multiSorting: false,
            actions: {
                listAction(postData, jtParams: JTableParams) {
                    return JTableHelper.toJTableListActionWithData(self._expiringTenantsData, self._expiringTenantsData.length, self._recentTenantsData);
                }
            },
            fields: {
                tenantName: {
                    title: this.l('TenantName')
                },
                remainingDayCount: {
                    title: this.l('RemainingDay')
                }
            }
        });

    }

    loadExpiringTenantsTable(expiringTenants): void {
        this._expiringTenantsData = expiringTenants;
        $(this.expiringTenantsTable.nativeElement).jtable('load');
    }

    gotoAllExpiringTenants(): void {
        const url = abp.appPath +
            'app/admin/tenants?' +
            'subscriptionEndDateStart=' +
            encodeURIComponent(this.hostDashboardData.subscriptionEndDateStart.format()) +
            '&' +
            'subscriptionEndDateEnd=' +
            encodeURIComponent(this.hostDashboardData.subscriptionEndDateEnd.format());

        window.open(url);
    }
}
