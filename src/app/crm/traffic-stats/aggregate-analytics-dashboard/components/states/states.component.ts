import { Component, OnInit } from "@angular/core";

@Component({
    selector: "app-aggregate-analytics-states",
    templateUrl: "./states.component.html",
    styleUrls: ["./states.component.less"],
})
export class StatesComponent implements OnInit {
    states = [
        {
            rank: 1,
            flag: "🇺🇸",
            name: "California",
            cities: 127,
            count: 12847,
            percent: "18.5%",
        },
        {
            rank: 2,
            flag: "🇺🇸",
            name: "Texas",
            cities: 89,
            count: 8934,
            percent: "12.9%",
        },
        {
            rank: 3,
            flag: "🇨🇦",
            name: "Ontario",
            cities: 54,
            count: 6567,
            percent: "9.5%",
        },
        {
            rank: 4,
            flag: "🇺🇸",
            name: "New York",
            cities: 43,
            count: 5234,
            percent: "7.6%",
        },
        {
            rank: 5,
            flag: "🇺🇸",
            name: "Florida",
            cities: 38,
            count: 4123,
            percent: "5.9%",
        },
        {
            rank: 6,
            flag: "🇨🇦",
            name: "British Columbia",
            cities: 29,
            count: 3456,
            percent: "5%",
        },
        {
            rank: 7,
            flag: "🇺🇸",
            name: "Illinois",
            cities: 25,
            count: 2789,
            percent: "4%",
        },
        {
            rank: 8,
            flag: "🇺🇸",
            name: "Ohio",
            cities: 21,
            count: 2345,
            percent: "3.4%",
        },
    ];

    constructor() {}

    ngOnInit(): void {}
}
