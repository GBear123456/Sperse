import { Injectable } from '@angular/core';

export class StatsItem {
    month: string;
    inflow: number;
    outflow: number;
}

let statsData: StatsItem[] =  [{
    month: 'January',
    inflow: 9.8,
    outflow: 4.1
}, {
    month: 'February',
    inflow: 11.8,
    outflow: 5.8
}, {
    month: 'March',
    inflow: 13.4,
    outflow: 7.2
}, {
    month: 'April',
    inflow: 15.4,
    outflow: 8.1
}, {
    month: 'May',
    inflow: 18,
    outflow: 10.3
}, {
    month: 'June',
    inflow: 20.6,
    outflow: 12.2
}, {
    month: 'July',
    inflow: 22.2,
    outflow: 13.2
}, {
    month: 'August',
    inflow: 22.2,
    outflow: 13.2
}, {
    month: 'September',
    inflow: 21.2,
    outflow: 12.4
}, {
    month: 'October',
    inflow: 17.9,
    outflow: 9.7
}, {
    month: 'November',
    inflow: 12.9,
    outflow: 6.2
}, {
    month: 'December',
    inflow: 9.6,
    outflow: 3.4
}];

@Injectable()
export class StatsService {
    getStatsData(): StatsItem[] {
        return statsData;
    }
}
