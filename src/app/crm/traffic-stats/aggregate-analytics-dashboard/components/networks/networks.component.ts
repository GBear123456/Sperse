import { Component, OnInit } from '@angular/core';

interface TrafficSource {
  rank: number;
  icon: string;
  name: string;
  change: string;
  changeColor: string;
  value: number;
  percentage: string;
}

@Component({
  selector: 'app-aggregate-analytics-networks',
  templateUrl: './networks.component.html',
})
export class NetworksComponent implements OnInit {
  sources: TrafficSource[] = [
    {
      rank: 1,
      icon: '🔍',
      name: 'Organic Search',
      change: '+12.4%',
      changeColor: 'text-green-600',
      value: 4567,
      percentage: '38.2%',
    },
    {
      rank: 2,
      icon: '📱',
      name: 'Social Media',
      change: '+8.7%',
      changeColor: 'text-blue-600',
      value: 2834,
      percentage: '23.7%',
    },
    {
      rank: 3,
      icon: '🌐',
      name: 'Direct Traffic',
      change: '-2.1%',
      changeColor: 'text-red-600',
      value: 1892,
      percentage: '15.8%',
    },
    {
      rank: 4,
      icon: '🔍',
      name: 'Paid Search',
      change: '+15.6%',
      changeColor: 'text-green-600',
      value: 1234,
      percentage: '10.3%',
    },
    {
      rank: 5,
      icon: '📧',
      name: 'Email Marketing',
      change: '+5.2%',
      changeColor: 'text-green-600',
      value: 867,
      percentage: '7.3%',
    },
    {
      rank: 6,
      icon: '🔗',
      name: 'Referral Sites',
      change: '+3.1%',
      changeColor: 'text-green-600',
      value: 423,
      percentage: '3.5%',
    },
    {
      rank: 7,
      icon: '📊',
      name: 'Display Ads',
      change: '-4.8%',
      changeColor: 'text-red-600',
      value: 156,
      percentage: '1.3%',
    },
  ];

  constructor() {}

  ngOnInit(): void {}
}
