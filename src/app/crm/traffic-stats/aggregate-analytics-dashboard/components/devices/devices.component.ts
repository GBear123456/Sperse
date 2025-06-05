import { Component, OnInit } from "@angular/core";

interface Device {
    name: string;
    icon: string;
    count: number;
    percentage: string;
    browsers: string[];
}

@Component({
    selector: "app-aggregate-analytics-devices",
    templateUrl: "./devices.component.html",
    styleUrls: ["./devices.component.less"],
})
export class DevicesComponent implements OnInit {
    devices: Device[] = [
        {
            name: "Desktop",
            icon: "monitor",
            count: 7834,
            percentage: "58.9%",
            browsers: ["Chrome", "Safari", "Firefox"],
        },
        {
            name: "Mobile",
            icon: "smartphone",
            count: 4567,
            percentage: "34.3%",
            browsers: ["Chrome Mobile", "Safari Mobile", "Samsung Browser"],
        },
        {
            name: "Tablet",
            icon: "tablet",
            count: 892,
            percentage: "6.7%",
            browsers: ["Safari", "Chrome", "Edge"],
        },
    ];

    constructor() {}

    ngOnInit(): void {}
}
