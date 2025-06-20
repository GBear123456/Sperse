import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-aggregate-analytics-countries',
  templateUrl: './countries.component.html',
})
export class CountriesComponent implements OnInit {
  countries = [
    {
      rank: 1,
      name: 'United States',
      flag: 'https://ipgeolocation.io/static/flags/us_64.png',
      count: 8947,
      percentage: '67.2%',
    },
    {
      rank: 2,
      name: 'Canada',
      flag: 'https://ipgeolocation.io/static/flags/ca_64.png',
      count: 1834,
      percentage: '13.8%',
    },
    {
      rank: 3,
      name: 'United Kingdom',
      flag: 'https://ipgeolocation.io/static/flags/gb_64.png',
      count: 892,
      percentage: '6.7%',
    },
    {
      rank: 4,
      name: 'Australia',
      flag: 'https://ipgeolocation.io/static/flags/au_64.png',
      count: 567,
      percentage: '4.3%',
    },
    {
      rank: 5,
      name: 'Germany',
      flag: 'https://ipgeolocation.io/static/flags/de_64.png',
      count: 423,
      percentage: '3.2%',
    },
    {
      rank: 6,
      name: 'France',
      flag: 'https://ipgeolocation.io/static/flags/fr_64.png',
      count: 289,
      percentage: '2.2%',
    },
    {
      rank: 7,
      name: 'Netherlands',
      flag: 'https://ipgeolocation.io/static/flags/nl_64.png',
      count: 178,
      percentage: '1.3%',
    },
    {
      rank: 8,
      name: 'Japan',
      flag: 'https://ipgeolocation.io/static/flags/jp_64.png',
      count: 156,
      percentage: '1.2%',
    },
  ];
  constructor() {}

  ngOnInit(): void {}
}
