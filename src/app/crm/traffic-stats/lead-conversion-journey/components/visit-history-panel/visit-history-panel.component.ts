import { Component, OnInit } from "@angular/core";

export interface Visit {
    id: number;
    date: string;
    time: string;
    duration: string;
    pages: number;
    ip: string;
    user: string;
    countryCode?: string; // e.g., 'US', 'DE', 'FR'
}

@Component({
    selector: "app-visit-history-panel",
    templateUrl: "./visit-history-panel.component.html",
})
export class VisitHistoryPanelComponent implements OnInit {
    visits: Visit[] = [
        {
            id: 49,
            date: "6/5/2025",
            time: "11:13:07 AM",
            duration: "7m 59s",
            pages: 8,
            ip: "10.0.0.123",
            user: "johndavis",
            countryCode: "CA",
        },
        {
            id: 48,
            date: "6/4/2025",
            time: "11:13:07 AM",
            duration: "1m 31s",
            pages: 4,
            ip: "172.16.0.89",
            user: "johndavis",
            countryCode: "US",
        },
        {
            id: 47,
            date: "6/3/2025",
            time: "11:13:07 AM",
            duration: "3m 36s",
            pages: 3,
            ip: "203.0.113.195",
            user: "johndavis",
            countryCode: "DE",
        },
        {
            id: 46,
            date: "6/2/2025",
            time: "11:13:07 AM",
            duration: "6m 41s",
            pages: 2,
            ip: "198.51.100.42",
            user: "johndavis",
            countryCode: "FR",
        },
        {
            id: 45,
            date: "6/1/2025",
            time: "11:13:07 AM",
            duration: "6m 34s",
            pages: 3,
            ip: "192.168.1.45",
            user: "johndavis",
            countryCode: "AU",
        },
        {
            id: 44,
            date: "5/31/2025",
            time: "11:13:07 AM",
            duration: "4m 36s",
            pages: 4,
            ip: "10.0.0.123",
            user: "johndavis",
            countryCode: "IN",
        },
    ];

    constructor() {}

    ngOnInit(): void {}

    getFlagUrl(code: string): string {
        return code
            ? `https://flagcdn.com/16x12/${code.toLowerCase()}.png`
            : "";
    }
}
