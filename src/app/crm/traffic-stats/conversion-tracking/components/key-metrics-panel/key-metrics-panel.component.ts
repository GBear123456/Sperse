import { Component, OnInit } from "@angular/core";

@Component({
    selector: "app-key-metrics-panel",
    templateUrl: "./key-metrics-panel.component.html",
})
export class KeyMetricsPanelComponent implements OnInit {
    constructor() {}

    ngOnInit(): void {}

    metrics = [
        {
            title: "Average Order Value",
            subtitle: "+5.2%",
            icon: "target",
            value: "$267.50",
            color: "#16a34a", // green-600
            bg: "#ecfdf5", // green-50
        },
        {
            title: "Time to Convert",
            subtitle: "-0.8 days",
            icon: "clock",
            value: "3.2 days",
            color: "#0ea5e9", // blue-500
            bg: "#f0f9ff", // blue-50
        },
        {
            title: "Top Channel",
            subtitle: "42% of traffic",
            icon: "zap",
            value: "Social Media",
            color: "#8b5cf6", // violet-500
            bg: "#f5f3ff", // violet-50
        },
        {
            title: "Best Performer",
            subtitle: "8.7% rate",
            icon: "award",
            value: "SMP2024",
            color: "#f97316", // orange-500
            bg: "#fff7ed", // orange-50
        },
    ];
}
