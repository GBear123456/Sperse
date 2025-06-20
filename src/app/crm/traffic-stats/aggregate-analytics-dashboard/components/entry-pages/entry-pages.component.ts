import { Component, OnInit } from '@angular/core';

interface PageStats {
  rank: number;
  title: string;
  path: string;
  views: number;
  percentage: number;
  bounce: string;
  avgTime: string;
}

@Component({
  selector: 'app-aggregate-analytics-entry-pages',
  templateUrl: './entry-pages.component.html',
})
export class EntryPagesComponent implements OnInit {
  pages: PageStats[] = [
    {
      rank: 1,
      title: 'Arizona Directory Listing',
      path: '/directory/arizona/listing',
      views: 3247,
      percentage: 32.4,
      bounce: '24.3%',
      avgTime: '3:42',
    },
    {
      rank: 2,
      title: 'Contact Us',
      path: '/contact',
      views: 1892,
      percentage: 18.9,
      bounce: '18.7%',
      avgTime: '2:15',
    },
    {
      rank: 3,
      title: 'Homepage',
      path: '/',
      views: 1567,
      percentage: 15.6,
      bounce: '32.1%',
      avgTime: '1:58',
    },
    {
      rank: 4,
      title: 'Our Services',
      path: '/services',
      views: 1234,
      percentage: 12.3,
      bounce: '28.9%',
      avgTime: '2:45',
    },
    {
      rank: 5,
      title: 'California Directory',
      path: '/directory/california/listing',
      views: 892,
      percentage: 8.9,
      bounce: '26.4%',
      avgTime: '3:12',
    },
    {
      rank: 6,
      title: 'About Us',
      path: '/about',
      views: 567,
      percentage: 5.7,
      bounce: '45.2%',
      avgTime: '1:23',
    },
    {
      rank: 7,
      title: 'Pricing Plans',
      path: '/pricing',
      views: 423,
      percentage: 4.2,
      bounce: '38.7%',
      avgTime: '2:01',
    },
    {
      rank: 8,
      title: 'Blog & Resources',
      path: '/blog',
      views: 289,
      percentage: 2.9,
      bounce: '52.1%',
      avgTime: '4:18',
    },
  ];

  constructor() {}

  ngOnInit(): void {}
}
