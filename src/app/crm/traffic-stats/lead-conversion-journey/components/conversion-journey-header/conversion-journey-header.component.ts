import { Component, OnInit } from "@angular/core";

@Component({
    selector: "app-conversion-journey-header",
    templateUrl: "./conversion-journey-header.component.html",
})
export class ConversionJourneyHeaderComponent implements OnInit {
    statsData = [
        {
            icon: "users",
            title: "Total Visits",
            value: 50,
            iconColor: "text-blue-500",
        },
        {
            icon: "users",
            title: "Total Leads",
            value: 5,
            iconColor: "text-green-500",
        },
        {
            icon: "message-square",
            title: "Total Chats",
            value: 3,
            iconColor: "text-blue-500",
        },
        {
            icon: "users",
            title: "Total Visits",
            value: 7,
            iconColor: "text-blue-500",
        },
        {
            icon: "log-in",
            title: "Total Logins",
            value: 19,
            iconColor: "text-blue-500",
        },
    ];

    constructor() {}

    ngOnInit(): void {}
}
