import { Component, OnInit } from "@angular/core";

@Component({
    selector: "app-conversion-trends-chart",
    templateUrl: "./conversion-trends-chart.component.html",
})
export class ConversionTrendsChartComponent implements OnInit {
    constructor() {}

    ngOnInit(): void {}

    data = [
        { week: "W1", value: 240 },
        { week: "W2", value: 265 },
        { week: "W3", value: 290 },
        { week: "W4", value: 310 },
        { week: "W5", value: 300 },
        { week: "W6", value: 330 },
        { week: "W7", value: 350 },
        { week: "W8", value: 375 },
    ];

    lineStyle = {
        color: "#8b5cf6",
        width: 2,
        visible: true,
    };
}
