import { Component, Input, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';
import Chart from 'chart.js';
import { Subject } from 'rxjs';
import { DashboardServiceProxy, GetCustomerAndLeadStatsOutput, GetGrossEarningsStatsOutput, GroupByPeriod } from '@shared/service-proxies/service-proxies';
import { takeUntil } from 'rxjs/operators';
import * as moment from 'moment';

export interface CustomerDataPoint {
  name: string;
  value: number;
  date: Date;
}

export interface CustomerChartData {
  name: string;
  series: CustomerDataPoint[];
}

@Component({
  selector: 'app-customers-chart',
  templateUrl: './customers-chart.component.html',
  styleUrls: ['./customers-chart.component.less']
})
export class CustomersChartComponent implements OnInit, OnDestroy, AfterViewInit, OnChanges {
  @Input() currentPeriodData: CustomerChartData[] = [];
  @Input() comparisonPeriodData: CustomerChartData[] = [];
  @Input() currentPeriodTotal: number = 0;
  @Input() percentageChange: number = 0;
  @Input() startDate: Date = new Date('2025-07-22');
  @Input() endDate: Date = new Date('2025-08-21');
  @Input() comparisonStartDate: Date = new Date('2025-06-21');
  @Input() comparisonEndDate: Date = new Date('2025-07-21');
  @Input() title: string = 'CUSTOMERS';
  @Input() icon: string = 'people';
  @Input() customerStatsData: any[] = [];
  @Input() grossEarningsStatsData: any[] = [];
  @Input() isLoading: boolean = false;

  @ViewChild('chartCanvas', { static: false }) chartCanvas!: ElementRef<HTMLCanvasElement>;
  
  private chart: Chart | null = null;
  private chartContext: CanvasRenderingContext2D | null = null;
  private destroy$ = new Subject<void>();

  // Chart configuration
  chartData: CustomerChartData[] = [];
  dateRange: { label: string, value: string } = { label: 'Between Dates', value: 'BETWEEN_DATES' };
  dateOptions = [
    { label: 'Between Dates', value: 'BETWEEN_DATES' },
    { label: 'Month to Date', value: 'MONTH_TO_DATE' },
    { label: 'Quarter to Date', value: 'QUARTER_TO_DATE' },
    { label: 'Year to Date', value: 'YEAR_TO_DATE' },
  ]

  constructor(private dashboardServiceProxy: DashboardServiceProxy) {}

  ngOnInit() {
    this.initializeChartData();
    this.loadCustomerChartData();
  }

  ngOnChanges(changes: SimpleChanges) {
    console.log('Chart component changes detected:', changes);
    
    // When customerStatsData changes, update the chart
    if (changes['customerStatsData']) {
      if (this.customerStatsData && this.customerStatsData.length > 0) {
        console.log('Customer stats data changed, updating chart');
        this.transformApiDataToChartData(this.customerStatsData);
      } else {
        console.log('Customer stats data is empty, generating empty chart data');
        this.generateEmptyChartData();
      }
    }
    
    // When grossEarningsStatsData changes, update the chart
    if (changes['grossEarningsStatsData']) {
      if (this.grossEarningsStatsData && this.grossEarningsStatsData.length > 0) {
        console.log('Gross earnings stats data changed, updating chart');
        this.transformGrossEarningsDataToChartData(this.grossEarningsStatsData);
      } else {
        console.log('Gross earnings stats data is empty, generating empty chart data');
        this.generateEmptyChartData();
      }
    }

    // When startDate or endDate changes, regenerate chart with new date range
    if (changes['startDate'] || changes['endDate']) {
      console.log('Date range changed, regenerating chart:', {
        startDate: this.startDate,
        endDate: this.endDate,
        startDateChanged: changes['startDate'],
        endDateChanged: changes['endDate']
      });
      this.regenerateChartWithNewDateRange();
    }
  }

  ngAfterViewInit() {
    this.initializeChart();
  }

  ngOnDestroy() {
    if (this.chart) {
      this.chart.destroy();
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeChartData() {
    // Generate sample data if none provided
    if (this.currentPeriodData.length === 0) {
      this.currentPeriodData = this.generateSampleData(this.startDate, this.endDate, 'Current Period');
    }
    if (this.comparisonPeriodData.length === 0) {
      this.comparisonPeriodData = this.generateSampleData(this.comparisonStartDate, this.comparisonEndDate, 'Comparison Period');
    }

    this.chartData = [...this.currentPeriodData, ...this.comparisonPeriodData];
  }

  refreshChart() {
    this.isLoading = true;
    
    // Load data from API
    this.loadCustomerChartData();
  }

  /**
   * Loads customer chart data from the API
   */
  private loadCustomerChartData(): void {
    // Only load data if this is a customer chart and no external data is provided
    if (this.title !== 'Customers' || (this.customerStatsData && this.customerStatsData.length > 0)) {
      return;
    }

    this.isLoading = true;
    
    // Convert start date to moment object
    const startDate = moment(this.startDate);
    
    // Call the API with the required parameters
    this.dashboardServiceProxy
      .getContactAndLeadStats(
        GroupByPeriod.Daily,  // GroupBy=Daily
        30,                   // periodCount (default 30 days)
        false,                // isCumulative=false
        startDate,            // startDate
        undefined,            // endDate (not needed when periodCount is provided)
        'C',                  // contactGroupId=C (Client group)
        undefined,            // sourceContactId (not needed)
        undefined             // sourceOrganizationUnitIds (not needed)
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: GetCustomerAndLeadStatsOutput[]) => {
          // Transform API response to chart data format
          this.transformApiDataToChartData(data);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading customer chart data:', error);
          this.isLoading = false;
          // Fallback to sample data on error
          this.initializeChartData();
        }
      });
  }

  /**
   * Transforms API response data to chart data format
   */
  private transformApiDataToChartData(apiData: GetCustomerAndLeadStatsOutput[]): void {
    console.log('Transforming customer API data to chart data:', {
      apiDataLength: apiData?.length || 0,
      startDate: this.startDate,
      endDate: this.endDate
    });
    
    if (!apiData || apiData.length === 0) {
      this.generateEmptyChartData();
      return;
    }

    // Generate complete date range labels for x-axis
    const dateRangeLabels = this.generateDateRangeLabels(this.startDate, this.endDate);
    console.log('Generated date range labels:', dateRangeLabels.length, 'labels');
    
    // Create a map of API data by date for easy lookup
    const apiDataMap = new Map<string, GetCustomerAndLeadStatsOutput>();
    apiData.forEach(item => {
      const dateKey = moment(item.date).format('YYYY-MM-DD');
      apiDataMap.set(dateKey, item);
    });

    // Transform current period data with complete date range
    const currentPeriodSeries: CustomerDataPoint[] = dateRangeLabels.map(label => {
      const dateKey = moment(label.date).format('YYYY-MM-DD');
      const apiItem = apiDataMap.get(dateKey);
      return {
        name: label.name,
        value: apiItem ? (apiItem.customerCount || 0) : 0,
        date: label.date
      };
    });

    console.log('Current period series generated:', currentPeriodSeries.length, 'data points');

    // Calculate comparison period data (same duration before current period)
    const periodDuration = this.endDate.getTime() - this.startDate.getTime();
    const comparisonStartDate = new Date(this.startDate.getTime() - periodDuration);
    const comparisonEndDate = new Date(this.startDate.getTime());

    // Generate comparison period data with complete date range
    const comparisonDateRangeLabels = this.generateDateRangeLabels(comparisonStartDate, comparisonEndDate);
    const comparisonPeriodSeries: CustomerDataPoint[] = comparisonDateRangeLabels.map(label => ({
      name: label.name,
      value: 0, // For now, using zero values for comparison period
      date: label.date
    }));

    // Update chart data
    this.currentPeriodData = [{
      name: 'Current Period',
      series: currentPeriodSeries
    }];

    this.comparisonPeriodData = [{
      name: 'Comparison Period',
      series: comparisonPeriodSeries
    }];

    // Update total and percentage change
    this.updateChartMetrics(currentPeriodSeries);

    // Update the chart with new data
    this.updateChartWithNewData();
  }


  /**
   * Updates chart metrics (total and percentage change)
   */
  private updateChartMetrics(currentPeriodSeries: CustomerDataPoint[]): void {
    // Calculate total customers for current period
    this.currentPeriodTotal = currentPeriodSeries.reduce((sum, point) => sum + point.value, 0);
    
    // Calculate percentage change (for now, using a default value)
    // In a real implementation, you would compare with previous period data
    this.percentageChange = 0; // This should be calculated based on comparison data
  }

  /**
   * Transforms Gross Earnings API response data to chart data format
   */
  private transformGrossEarningsDataToChartData(apiData: GetGrossEarningsStatsOutput[]): void {
    console.log('Transforming gross earnings API data to chart data:', {
      apiDataLength: apiData?.length || 0,
      startDate: this.startDate,
      endDate: this.endDate
    });
    
    if (!apiData || apiData.length === 0) {
      this.generateEmptyChartData();
      return;
    }

    // Generate complete date range labels for x-axis
    const dateRangeLabels = this.generateDateRangeLabels(this.startDate, this.endDate);
    console.log('Generated date range labels for gross earnings:', dateRangeLabels.length, 'labels');
    
    // Create a map of API data by date for easy lookup
    const apiDataMap = new Map<string, GetGrossEarningsStatsOutput>();
    apiData.forEach(item => {
      const dateKey = moment(item.date).format('YYYY-MM-DD');
      apiDataMap.set(dateKey, item);
    });

    // Transform current period data with complete date range
    const currentPeriodSeries: CustomerDataPoint[] = dateRangeLabels.map(label => {
      const dateKey = moment(label.date).format('YYYY-MM-DD');
      const apiItem = apiDataMap.get(dateKey);
      return {
        name: label.name,
        value: apiItem ? (apiItem.amount || 0) : 0,
        date: label.date
      };
    });

    console.log('Gross earnings current period series generated:', currentPeriodSeries.length, 'data points');

    // Calculate comparison period data (same duration before current period)
    const periodDuration = this.endDate.getTime() - this.startDate.getTime();
    const comparisonStartDate = new Date(this.startDate.getTime() - periodDuration);
    const comparisonEndDate = new Date(this.startDate.getTime());

    // Generate comparison period data with complete date range
    const comparisonDateRangeLabels = this.generateDateRangeLabels(comparisonStartDate, comparisonEndDate);
    const comparisonPeriodSeries: CustomerDataPoint[] = comparisonDateRangeLabels.map(label => ({
      name: label.name,
      value: 0, // For now, using zero values for comparison period
      date: label.date
    }));

    // Update chart data
    this.currentPeriodData = [{
      name: 'Current Period',
      series: currentPeriodSeries
    }];

    this.comparisonPeriodData = [{
      name: 'Comparison Period',
      series: comparisonPeriodSeries
    }];

    // Update total and percentage change for gross earnings
    this.updateGrossEarningsMetrics(currentPeriodSeries);

    // Update the chart with new data
    this.updateChartWithNewData();
  }

  /**
   * Updates gross earnings metrics (total and percentage change)
   */
  private updateGrossEarningsMetrics(currentPeriodSeries: CustomerDataPoint[]): void {
    // Calculate total gross earnings for current period
    this.currentPeriodTotal = currentPeriodSeries.reduce((sum, point) => sum + point.value, 0);
    
    // Calculate percentage change (for now, using a default value)
    // In a real implementation, you would compare with previous period data
    this.percentageChange = 80.15; // This should be calculated based on comparison data
  }

  private initializeChart() {
    if (!this.chartCanvas) return;

    const canvas = this.chartCanvas.nativeElement;
    this.chartContext = canvas.getContext('2d');
    
    if (!this.chartContext) return;

    // Destroy existing chart if it exists
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }

    // Create gradients
    const currentPeriodGradient = this.chartContext.createLinearGradient(0, 0, 0, 400);
    currentPeriodGradient.addColorStop(0, 'rgba(139, 0, 0, 0.2)'); // Maroon with opacity
    currentPeriodGradient.addColorStop(0.9, 'rgba(255,255,255,0)');
    currentPeriodGradient.addColorStop(1, 'rgba(255,255,255,0)');

    const previousPeriodGradient = this.chartContext.createLinearGradient(0, 0, 0, 400);
    previousPeriodGradient.addColorStop(0, 'rgba(135, 206, 235, 0.2)'); // Light blue with opacity
    previousPeriodGradient.addColorStop(0.9, 'rgba(255,255,255,0)');
    previousPeriodGradient.addColorStop(1, 'rgba(255,255,255,0)');

    // Extract labels and data
    const labels = this.currentPeriodData[0]?.series.map(point => point.name) || [];
    const currentData = this.currentPeriodData[0]?.series.map(point => point.value) || [];
    const comparisonData = this.comparisonPeriodData[0]?.series.map(point => point.value) || [];
    
    console.log('Chart initialization data:', {
      labels: labels,
      currentDataLength: currentData.length,
      comparisonDataLength: comparisonData.length,
      title: this.title
    });

    const datasets = [
      {
        data: currentData,
        label: 'Current Period',
        backgroundColor: currentPeriodGradient,
        borderColor: '#8B0000', // Maroon
        pointBorderColor: '#ffffff',
        pointBorderWidth: 3,
        pointRadius: 6,
        pointBackgroundColor: '#8B0000',
        fill: true,
        borderWidth: 2
      }
    ];

    // Add comparison data if available
    if (comparisonData.length > 0) {
      datasets.push({
        data: comparisonData,
        label: 'Previous Period',
        backgroundColor: previousPeriodGradient,
        borderColor: '#87CEEB', // Light blue
        pointBorderColor: '#ffffff',
        pointBorderWidth: 3,
        pointRadius: 3,
        pointBackgroundColor: '#87CEEB',
        fill: true,
        borderWidth: 2
      });
    }

    try {
      this.chart = new Chart(canvas, {
        type: 'line',
        data: {
          labels: labels,
          datasets: datasets
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: {
            duration: 1000
          },
          legend: {
            display: false
          },
          layout: {
            padding: {
              left: 2,
              right: 1
            }
          },
          scales: {
            xAxes: [
              {
                gridLines: {
                  display: false,
                  drawBorder: false
                },
                ticks: {
                  padding: 4,
                  fontColor: '#6B7280',
                  autoSkip: true,
                  maxTicksLimit: 12,
                  fontSize: 11
                }
              }
            ],
            yAxes: [
              {
                gridLines: {
                  display: false
                },
                ticks: {
                  fontColor: '#6B7280',
                  beginAtZero: true,
                  min: 0,
                  maxTicksLimit: 7,
                  callback: () => (''),
                  autoSkip: true,
                  fontSize: 11
                }
              }
            ]
          },
          tooltips: {
            enabled: true,
            mode: 'index',
            intersect: false,
            backgroundColor: '#ffffff',
            titleFontColor: '#111827',
            bodyFontColor: '#6B7280',
            borderColor: '#E5E7EB',
            borderWidth: 1,
            yPadding: 20,
            xPadding: 20,
            cornerRadius: 8,
            displayColors: false,
            callbacks: {
              title: () => null,
              label: (tooltipItem: any) => {
                let prefix: string;
                let xLabel: string;

                if (tooltipItem.datasetIndex === 0) {
                  prefix = 'Current';
                  xLabel = `${tooltipItem.xLabel}`;
                } else {
                  prefix = 'Previous';
                  xLabel = `${tooltipItem.xLabel}`;
                }

                return [
                  `${xLabel}: `,
                  `${prefix}: `,
                  `${tooltipItem.yLabel.toLocaleString()}`,
                ].join('');
              }
            }
          }
        }
      });
    } catch (error) {
      console.error('Error creating chart:', error);
    }
  }

  private generateSampleData(startDate: Date, endDate: Date, periodName: string): CustomerChartData[] {
    const data: CustomerChartData[] = [];
    const series: CustomerDataPoint[] = [];

    // Generate data points for each day in the date range with zero values
    const currentDate = new Date(startDate);
    const endDateObj = new Date(endDate);

    while (currentDate <= endDateObj) {
      series.push({
        name: moment(currentDate).format('MM/DD'),
        value: 0, // Initialize with zero values
        date: new Date(currentDate)
      });

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    data.push({
      name: periodName,
      series: series
    });

    return data;
  }

  /**
   * Generates date range labels for the x-axis based on the selected date range
   */
  private generateDateRangeLabels(startDate: Date, endDate: Date): CustomerDataPoint[] {
    console.log('Generating date range labels:', {
      startDate: startDate,
      endDate: endDate
    });
    
    const labels: CustomerDataPoint[] = [];
    const currentDate = new Date(startDate);
    const endDateObj = new Date(endDate);

    while (currentDate <= endDateObj) {
      labels.push({
        name: moment(currentDate).format('MM/DD'),
        value: 0, // Will be filled with actual data
        date: new Date(currentDate)
      });

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    console.log('Generated', labels.length, 'date range labels:', labels.map(l => l.name));
    return labels;
  }

  /**
   * Regenerates the chart when date range changes
   */
  private regenerateChartWithNewDateRange(): void {
    console.log('Regenerating chart with new date range:', {
      startDate: this.startDate,
      endDate: this.endDate,
      hasCustomerData: this.customerStatsData && this.customerStatsData.length > 0,
      hasGrossEarningsData: this.grossEarningsStatsData && this.grossEarningsStatsData.length > 0,
      title: this.title
    });
    
    // Always update the x-axis with the new date range, regardless of data availability
    // This ensures the chart shows the correct date range even if there's an API error
    
    // If we have existing data, regenerate the chart with the new date range
    if (this.title === 'Gross Earnings' && this.grossEarningsStatsData && this.grossEarningsStatsData.length > 0) {
      console.log('Using gross earnings stats data for chart regeneration');
      this.transformGrossEarningsDataToChartData(this.grossEarningsStatsData);
    } else if (this.title === 'Customers' && this.customerStatsData && this.customerStatsData.length > 0) {
      console.log('Using customer stats data for chart regeneration');
      this.transformApiDataToChartData(this.customerStatsData);
    } else {
      console.log('No data available or API error, generating empty chart data for new date range');
      // If no data or API error, generate empty chart data for the new date range
      // This ensures the x-axis is updated even when there's no data
      this.generateEmptyChartData();
    }
  }

  /**
   * Generates empty chart data for the current date range
   * This is used when there's no API data but we still need to show the chart with proper x-axis
   */
  private generateEmptyChartData(): void {
    console.log('Generating empty chart data for date range:', {
      startDate: this.startDate,
      endDate: this.endDate
    });

    // Generate complete date range labels for x-axis
    const dateRangeLabels = this.generateDateRangeLabels(this.startDate, this.endDate);
    
    // Create empty data series for current period
    const currentPeriodSeries: CustomerDataPoint[] = dateRangeLabels.map(label => ({
      name: label.name,
      value: 0,
      date: label.date
    }));

    // Calculate comparison period data (same duration before current period)
    const periodDuration = this.endDate.getTime() - this.startDate.getTime();
    const comparisonStartDate = new Date(this.startDate.getTime() - periodDuration);
    const comparisonEndDate = new Date(this.startDate.getTime());

    // Generate comparison period data with complete date range
    const comparisonDateRangeLabels = this.generateDateRangeLabels(comparisonStartDate, comparisonEndDate);
    const comparisonPeriodSeries: CustomerDataPoint[] = comparisonDateRangeLabels.map(label => ({
      name: label.name,
      value: 0,
      date: label.date
    }));

    // Update chart data
    this.currentPeriodData = [{
      name: 'Current Period',
      series: currentPeriodSeries
    }];

    this.comparisonPeriodData = [{
      name: 'Comparison Period',
      series: comparisonPeriodSeries
    }];

    // Update the chart with new data
    this.updateChartWithNewData();
  }

  /**
   * Updates the chart with new data without recreating it
   */
  private updateChartWithNewData(): void {
    if (!this.chart) {
      console.log('No chart instance, initializing new chart');
      this.initializeChart();
      return;
    }

    console.log('Updating existing chart with new data');
    
    // Extract labels and data
    const labels = this.currentPeriodData[0]?.series.map(point => point.name) || [];
    const currentData = this.currentPeriodData[0]?.series.map(point => point.value) || [];
    const comparisonData = this.comparisonPeriodData[0]?.series.map(point => point.value) || [];

    console.log('Updating chart with new data:', {
      labels: labels,
      currentDataLength: currentData.length,
      comparisonDataLength: comparisonData.length,
      title: this.title
    });

    // Update chart data
    this.chart.data.labels = labels;
    this.chart.data.datasets[0].data = currentData;
    
    if (this.chart.data.datasets.length > 1) {
      this.chart.data.datasets[1].data = comparisonData;
    }

    // Update the chart with animation
    this.chart.update('active');
  }

  /**
   * Forces chart regeneration with current date range
   * This method can be called externally to force a chart update
   */
  public forceChartUpdate(): void {
    console.log('Forcing chart update with current date range');
    this.regenerateChartWithNewDateRange();
  }

  /**
   * Forces x-axis update with current date range
   * This method specifically updates the x-axis even when there's no data
   */
  public forceXAxisUpdate(): void {
    console.log('Forcing x-axis update with current date range');
    this.generateEmptyChartData();
  }

  /**
   * Handles the case where data is empty but we still need to update the chart
   * This ensures the x-axis is updated even when there's no data
   */
  public handleEmptyData(): void {
    console.log('Handling empty data, updating chart with current date range');
    this.generateEmptyChartData();
  }

  /**
   * Updates the chart when date range changes but there's no data
   * This method is called when the date range changes but there's no API data
   */
  public updateChartForDateRangeChange(): void {
    console.log('Updating chart for date range change with current data state');
    
    // Check if we have any data to work with
    if (this.title === 'Gross Earnings' && this.grossEarningsStatsData && this.grossEarningsStatsData.length > 0) {
      this.transformGrossEarningsDataToChartData(this.grossEarningsStatsData);
    } else if (this.title === 'Customers' && this.customerStatsData && this.customerStatsData.length > 0) {
      this.transformApiDataToChartData(this.customerStatsData);
    } else {
      // No data available, generate empty chart with proper x-axis
      this.generateEmptyChartData();
    }
  }

  /**
   * Public method to force chart update when date range changes
   * This can be called from parent components to ensure x-axis is updated
   */
  public forceDateRangeUpdate(): void {
    console.log('Forcing date range update for chart');
    this.updateChartForDateRangeChange();
  }

  /**
   * Public method to force chart update when there's an API error
   * This ensures the x-axis is updated even when there's no data
   */
  public forceUpdateOnApiError(): void {
    console.log('Forcing chart update on API error');
    this.generateEmptyChartData();
  }

  /**
   * Public method to force chart update when there's no data
   * This ensures the x-axis is updated even when there's no data
   */
  public forceUpdateOnNoData(): void {
    console.log('Forcing chart update on no data');
    this.generateEmptyChartData();
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: '2-digit'
    });
  }

  get isPositiveChange(): boolean {
    return this.percentageChange >= 0;
  }

  onDateRangeChange(event: any) {
    // Handle date range change
    console.log('Date range changed:', event.value);
    this.dateRange = this.dateOptions.find(option => option.value === event.value) || this.dateRange;
    
    // Update comparison dates based on selected range
    this.updateComparisonDates();
    
    // Load data from API with new date range
    this.loadCustomerChartData();
  }

  onStartDateChange(event: any) {
    this.startDate = event.value;
    this.updateComparisonDates();
    this.loadCustomerChartData();
  }

  onEndDateChange(event: any) {
    this.endDate = event.value;
    this.updateComparisonDates();
    this.loadCustomerChartData();
  }

  private updateComparisonDates() {
    if (this.dateRange.value === 'BETWEEN_DATES') {
      // Calculate comparison period (same duration before the selected period)
      const periodDuration = this.endDate.getTime() - this.startDate.getTime();
      this.comparisonStartDate = new Date(this.startDate.getTime() - periodDuration);
      this.comparisonEndDate = new Date(this.startDate.getTime());
    } else {
      // Handle other date range types
      this.updateComparisonDatesForRange();
    }
    
    // Note: We don't call loadCustomerChartData() here to avoid double API calls
    // The calling method (onStartDateChange, onEndDateChange, onDateRangeChange) will handle it
  }

  private updateComparisonDatesForRange() {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    switch (this.dateRange.value) {
      case 'MONTH_TO_DATE':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = now;
        break;
      case 'QUARTER_TO_DATE':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        endDate = now;
        break;
      case 'YEAR_TO_DATE':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = now;
        break;
      default:
        startDate = this.startDate;
        endDate = this.endDate;
    }

    this.startDate = startDate;
    this.endDate = endDate;

    // Calculate comparison period
    const periodDuration = endDate.getTime() - startDate.getTime();
    this.comparisonStartDate = new Date(startDate.getTime() - periodDuration);
    this.comparisonEndDate = new Date(startDate.getTime());
    
    // Note: The calling method will handle loading data from API
  }
}
