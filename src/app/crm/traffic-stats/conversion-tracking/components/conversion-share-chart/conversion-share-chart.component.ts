import { Component, OnInit } from "@angular/core";
import { ChartOptions, ChartType } from "chart.js";

@Component({
    selector: "app-conversion-share-chart",
    templateUrl: "./conversion-share-chart.component.html",
})
export class ConversionShareChartComponent implements OnInit {
    constructor() {}

    ngOnInit(): void {}

    chartData = [
        { affiliate: "zheng16", share: 30, color: "#a78bfa" },
        { affiliate: "ryan54", share: 25, color: "#ec4899" },
        { affiliate: "marktime", share: 20, color: "#f97316" },
        { affiliate: "jamesome", share: 15, color: "#06b6d4" },
        { affiliate: "others", share: 10, color: "#6b7280" },
    ];

    customizeTooltip(pointInfo: any) {
        return {
            text: `${pointInfo.argumentText}: ${pointInfo.percentText}`,
        };
    }
}
