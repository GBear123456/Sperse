import { Component, OnInit } from "@angular/core";

@Component({
    selector: "app-aggregate-analytics-dashboard",
    templateUrl: "./aggregate-analytics-dashboard.component.html",
    styleUrls: ["./aggregate-analytics-dashboard.component.less"],
})
export class AggregateAnalyticsDashboardComponent implements OnInit {
    currentDateTime: string;

    constructor() {}

    ngOnInit(): void {
        const now = new Date();
        this.currentDateTime = now.toLocaleString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        });
    }

    statsData = {
        totalVisitors: {
            value: 127845,
            percent: 14.2,
        },
        totalLeads: {
            value: 8542,
            percent: 7.4,
        },
        conversionRate: {
            value: 6.68,
            percent: 1.2,
        },
        globalReach: {
            value: 47,
            percent: 3,
        },
    };
}
