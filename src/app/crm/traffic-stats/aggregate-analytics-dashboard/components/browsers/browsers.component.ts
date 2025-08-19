import { Component, OnInit } from '@angular/core';

interface BrowserStat {
  id: number;
  icon: string;
  name: string;
  version: string;
  color: string;
  count: number;
  percentage: number;
}

@Component({
  selector: 'app-aggregate-analytics-browsers',
  templateUrl: './browsers.component.html',
})
export class BrowsersComponent implements OnInit {
  browsers: BrowserStat[] = [
    {
      id: 1,
      icon: '🟡',
      name: 'Chrome',
      version: 'v120.0',
      color: '52%',
      count: 45234,
      percentage: 52.3,
    },
    {
      id: 2,
      icon: '🔵',
      name: 'Safari',
      version: 'v17.1',
      color: '22%',
      count: 18567,
      percentage: 21.5,
    },
    {
      id: 3,
      icon: '🟠',
      name: 'Firefox',
      version: 'v121.0',
      color: '14%',
      count: 12345,
      percentage: 14.3,
    },
    {
      id: 4,
      icon: '🔵',
      name: 'Edge',
      version: 'v120.0',
      color: '8%',
      count: 6789,
      percentage: 7.9,
    },
    {
      id: 5,
      icon: '🔴',
      name: 'Opera',
      version: 'v105.0',
      color: '2%',
      count: 2134,
      percentage: 2.5,
    },
    {
      id: 6,
      icon: '🟣',
      name: 'Samsung Internet',
      version: 'v23.0',
      color: '1%',
      count: 876,
      percentage: 1.0,
    },
    {
      id: 7,
      icon: '🟢',
      name: 'UC Browser',
      version: 'v15.0',
      color: '0%',
      count: 345,
      percentage: 0.4,
    },
    {
      id: 8,
      icon: '🟠',
      name: 'Brave',
      version: 'v1.61',
      color: '0%',
      count: 123,
      percentage: 0.1,
    },
  ];

  constructor() {}

  ngOnInit(): void {}
}
