import { Component, OnInit } from "@angular/core";

@Component({
    selector: "app-monthly-revenue-chart",
    templateUrl: "./monthly-revenue-chart.component.html",
})
export class MonthlyRevenueChartComponent implements OnInit {
    constructor() {}

    ngOnInit(): void {}

    revenueData = [
        { month: "Jan", value: 70000 },
        { month: "Feb", value: 76000 },
        { month: "Mar", value: 72000 },
        { month: "Apr", value: 87000 },
        { month: "May", value: 91000 },
        { month: "Jun", value: 86000 },
        { month: "Jul", value: 99000 },
        { month: "Aug", value: 114000 },
        { month: "Sep", value: 108000 },
        { month: "Oct", value: 124000 },
        { month: "Nov", value: 130000 },
        { month: "Dec", value: 140000 },
    ];

    formatCurrency = ({ valueText }: any) => {
        return `$${valueText}k`;
    };
}
