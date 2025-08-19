import { Component, OnInit } from "@angular/core";

@Component({
    selector: "app-visits-trend-chart",
    templateUrl: "./visits-trend-chart.component.html",
})
export class VisitsTrendChartComponent implements OnInit {
    constructor() {}

    ngOnInit(): void {}

    timeRanges = ["Week", "Month", "Year", "All"];
    selectedRange = "All";

    // Replace with dynamic filter logic
    get filteredData() {
        return this.data;
    }

    data = [
        { date: "Mar 30", zheng16: 210, ryan54: 160, marktime: 120 },
        { date: "Mar 31", zheng16: 180, ryan54: 150, marktime: 110 },
        { date: "Apr 1", zheng16: 230, ryan54: 165, marktime: 125 },
        { date: "Apr 2", zheng16: 190, ryan54: 155, marktime: 115 },
        { date: "Apr 3", zheng16: 220, ryan54: 162, marktime: 118 },
        { date: "Apr 4", zheng16: 175, ryan54: 150, marktime: 105 },
        { date: "Apr 5", zheng16: 200, ryan54: 158, marktime: 115 },
    ];

    seriesFields = [
        { field: "zheng16", name: "zheng16", color: "#a78bfa" },
        { field: "ryan54", name: "ryan54", color: "#ec4899" },
        { field: "marktime", name: "marktime", color: "#f97316" },
    ];

    selectRange(range: string) {
        this.selectedRange = range;
        // Filtering logic can be added here if data is dynamic
    }
}
