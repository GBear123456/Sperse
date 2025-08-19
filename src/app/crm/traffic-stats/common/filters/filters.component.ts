import { Component, OnInit, Input } from "@angular/core";

@Component({
    selector: "app-traffic-stats-filters",
    templateUrl: "./filters.component.html",
    styleUrls: [],
})
export class AggregateAnalyticsFiltersComponent implements OnInit {
    @Input() searchPlaceholder: string = "Search affiliate code...";

    constructor() {}

    ngOnInit(): void {}
}
