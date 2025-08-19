import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-aggregate-analytics-keywords',
  templateUrl: './keywords.component.html',
})
export class KeywordsComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {}

  topKeywords = [
    { rank: 1, keyword: 'adult daycare', count: '1,247', percent: 24.8 },
    { rank: 2, keyword: 'senior care', count: '986', percent: 19.6 },
    {
      rank: 3,
      keyword: 'elderly care services',
      count: '743',
      percent: 14.8,
    },
    {
      rank: 4,
      keyword: 'daycare for seniors',
      count: '612',
      percent: 12.2,
    },
    { rank: 5, keyword: 'adult day center', count: '589', percent: 11.7 },
    { rank: 6, keyword: 'senior activities', count: '423', percent: 8.4 },
    { rank: 7, keyword: 'memory care', count: '401', percent: 8 },
    { rank: 8, keyword: 'respite care', count: '234', percent: 4.7 },
  ];
}
