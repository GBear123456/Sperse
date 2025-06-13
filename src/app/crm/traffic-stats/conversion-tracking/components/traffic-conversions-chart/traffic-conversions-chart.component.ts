import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-traffic-conversions-chart',
  templateUrl: './traffic-conversions-chart.component.html',
})
export class TrafficConversionsChartComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {}

  periods = ['Day', 'Week', 'Month'];
  selectedPeriod = 'Week';

  data = [
    { day: 'Mon', traffic: 18, conversions: 6 },
    { day: 'Tue', traffic: 24, conversions: 8 },
    { day: 'Wed', traffic: 32, conversions: 9 },
    { day: 'Thu', traffic: 21, conversions: 8 },
    { day: 'Fri', traffic: 29, conversions: 8 },
    { day: 'Sat', traffic: 16, conversions: 5 },
    { day: 'Sun', traffic: 13, conversions: 4 },
  ];

  selectPeriod(period: string) {
    this.selectedPeriod = period;
  }
}
