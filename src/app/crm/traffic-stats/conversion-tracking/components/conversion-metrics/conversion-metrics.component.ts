import { Component, OnInit } from "@angular/core";

@Component({
    selector: "app-conversion-tracking-metrics",
    templateUrl: "./conversion-metrics.component.html",
})
export class ConversionMetricsComponent implements OnInit {
    metricCards = [
        {
            title: "Total Affiliate Earnings",
            value: "$125,847",
            change: "+15.3%",
            icon: "dollar-sign",
            iconColor: "text-green-600",
            bgColor: "bg-green-50",
        },
        {
            title: "Total Paid",
            value: "$89,234",
            change: "+12.1%",
            icon: "trending-up",
            iconColor: "text-blue-600",
            bgColor: "bg-blue-50",
        },
        {
            title: "Total Pending (Unearned)",
            value: "$24,891",
            change: "+8.7%",
            icon: "target",
            iconColor: "text-yellow-600",
            bgColor: "bg-yellow-50",
        },
        {
            title: "Total Due",
            value: "$11,722",
            change: "+22.5%",
            icon: "user",
            iconColor: "text-red-600",
            bgColor: "bg-red-50",
        },
        {
            title: "Total Revenue",
            value: "$847,392",
            change: "+22.1%",
            icon: "dollar-sign",
            iconColor: "text-green-600",
            bgColor: "bg-green-50",
        },
        {
            title: "Total Visits",
            value: "12,545",
            change: "+14.2%",
            icon: "users",
            iconColor: "text-blue-600",
            bgColor: "bg-blue-50",
        },
        {
            title: "Total Leads",
            value: "542",
            change: "+7.8%",
            icon: "target",
            iconColor: "text-purple-600",
            bgColor: "bg-purple-50",
        },
        {
            title: "Total Sales (Units)",
            value: "3,247",
            change: "+18.3%",
            icon: "trending-up",
            iconColor: "text-green-600",
            bgColor: "bg-red-50",
        },
    ];

    constructor() {}

    ngOnInit(): void {}
}
