import { Component, OnInit, Input } from "@angular/core";

@Component({
    selector: "app-aggregate-analytics-stats-cards",
    templateUrl: "./stats-cards.component.html",
    styleUrls: ["./stats-cards.component.less"],
})
export class StatsCardsComponent implements OnInit {
    @Input() totalVisitors: {
        value: number;
        percent: number;
    };
    @Input() totalLeads: {
        value: number;
        percent: number;
    };
    @Input() conversionRate: {
        value: number;
        percent: number;
    };
    @Input() globalReach: {
        value: number;
        percent: number;
    };

    constructor() {}

    ngOnInit(): void {}

    teatValue = "what the fucking";
}
