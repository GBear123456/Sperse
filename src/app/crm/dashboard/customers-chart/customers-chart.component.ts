import { Component, Input, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import Chart from 'chart.js';

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
export class CustomersChartComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() currentPeriodData: CustomerChartData[] = [];
  @Input() comparisonPeriodData: CustomerChartData[] = [];
  @Input() currentPeriodTotal: number = 245;
  @Input() percentageChange: number = 80.15;
  @Input() startDate: Date = new Date('2025-07-22');
  @Input() endDate: Date = new Date('2025-08-21');
  @Input() comparisonStartDate: Date = new Date('2025-06-21');
  @Input() comparisonEndDate: Date = new Date('2025-07-21');
  @Input() title: string = 'CUSTOMERS';
  @Input() icon: string = 'people';

  @ViewChild('chartCanvas', { static: false }) chartCanvas!: ElementRef<HTMLCanvasElement>;
  
  private chart: Chart | null = null;
  private chartContext: CanvasRenderingContext2D | null = null;

  // Chart configuration
  chartData: CustomerChartData[] = [];
  dateRange: { label: string, value: string } = { label: 'Between Dates', value: 'BETWEEN_DATES' };
  isLoading: boolean = false;
  dateOptions = [
    { label: 'Between Dates', value: 'BETWEEN_DATES' },
    { label: 'Month to Date', value: 'MONTH_TO_DATE' },
    { label: 'Quarter to Date', value: 'QUARTER_TO_DATE' },
    { label: 'Year to Date', value: 'YEAR_TO_DATE' },
  ]


  ngOnInit() {
    this.initializeChartData();
  }

  ngAfterViewInit() {
    this.initializeChart();
  }

  ngOnDestroy() {
    if (this.chart) {
      this.chart.destroy();
    }
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
    
    // Simulate API call or data refresh
    setTimeout(() => {
      this.initializeChartData();
      this.initializeChart();
      this.isLoading = false;
    }, 1000);
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
    const currentDate = new Date(startDate);
    const series: CustomerDataPoint[] = [];

    // Generate data that matches the screenshot pattern exactly
    if (periodName === 'Current Period') {
      // Maroon line pattern from screenshot (upper trend with significant fluctuations)
      const dataPoints = [
        { date: '07/22', value: 180 },  // Start moderate
        { date: '07/23', value: 200 },
        { date: '07/24', value: 220 },
        { date: '07/25', value: 280 },  // First peak
        { date: '07/26', value: 300 },  // Peak around July 25-26
        { date: '07/27', value: 250 },
        { date: '07/28', value: 120 },  // Significant drop
        { date: '07/29', value: 100 },
        { date: '07/30', value: 350 },  // Sharp spike around July 30-31
        { date: '07/31', value: 380 },  // Higher than first peak
        { date: '08/01', value: 150 },
        { date: '08/02', value: 120 },
        { date: '08/03', value: 100 },
        { date: '08/04', value: 80 },
        { date: '08/05', value: 90 },
        { date: '08/06', value: 70 },
        { date: '08/07', value: 60 },
        { date: '08/08', value: 80 },
        { date: '08/09', value: 90 },
        { date: '08/10', value: 70 },
        { date: '08/11', value: 60 },
        { date: '08/12', value: 80 },
        { date: '08/13', value: 100 },
        { date: '08/14', value: 450 },  // Very prominent peak around August 14-15
        { date: '08/15', value: 480 },  // Highest point on chart
        { date: '08/16', value: 300 },
        { date: '08/17', value: 200 },
        { date: '08/18', value: 150 },  // Decline until around August 18
        { date: '08/19', value: 200 },
        { date: '08/20', value: 250 },  // Small increase towards August 20-21
        { date: '08/21', value: 280 }   // End at moderately high level
      ];

      dataPoints.forEach(point => {
        series.push({
          name: point.date,
          value: point.value,
          date: new Date(point.date + '/2025')
        });
      });
    } else {
      // Light blue line pattern from screenshot (lower trend, flatter and less volatile)
      const dataPoints = [
        { date: '07/22', value: 80 },   // Start low
        { date: '07/23', value: 90 },
        { date: '07/24', value: 100 },
        { date: '07/25', value: 120 },  // Small peak around July 25
        { date: '07/26', value: 110 },
        { date: '07/27', value: 100 },
        { date: '07/28', value: 90 },
        { date: '07/29', value: 85 },
        { date: '07/30', value: 95 },
        { date: '07/31', value: 100 },
        { date: '08/01', value: 90 },
        { date: '08/02', value: 85 },
        { date: '08/03', value: 80 },
        { date: '08/04', value: 75 },
        { date: '08/05', value: 80 },
        { date: '08/06', value: 70 },
        { date: '08/07', value: 65 },
        { date: '08/08', value: 70 },
        { date: '08/09', value: 75 },
        { date: '08/10', value: 70 },
        { date: '08/11', value: 65 },
        { date: '08/12', value: 70 },
        { date: '08/13', value: 75 },
        { date: '08/14', value: 80 },
        { date: '08/15', value: 85 },
        { date: '08/16', value: 90 },
        { date: '08/17', value: 95 },
        { date: '08/18', value: 100 },  // Slight upward trend from August 18
        { date: '08/19', value: 105 },
        { date: '08/20', value: 110 },
        { date: '08/21', value: 115 }   // Still well below maroon line
      ];

      dataPoints.forEach(point => {
        series.push({
          name: point.date,
          value: point.value,
          date: new Date(point.date + '/2025')
        });
      });
    }

    data.push({
      name: periodName,
      series: series
    });

    return data;
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
    
    // Reinitialize chart with new data
    this.initializeChartData();
    this.initializeChart();
  }

  onStartDateChange(event: any) {
    this.startDate = event.value;
    this.updateComparisonDates();
    this.initializeChartData();
    this.initializeChart();
  }

  onEndDateChange(event: any) {
    this.endDate = event.value;
    this.updateComparisonDates();
    this.initializeChartData();
    this.initializeChart();
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
  }
}
