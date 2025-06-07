import { Component, OnInit } from "@angular/core";

@Component({
    selector: "app-lead-conversion-journey",
    templateUrl: "./lead-conversion-journey.component.html",
})
export class LeadConversionJourneyComponent implements OnInit {
    constructor() {}

    stats = [
        {
            icon: "./assets/images/icons/traffic-users.svg",
            label: "Total Visits",
            value: 50,
            colorClass: "blue",
        },
        {
            icon: "./assets/images/icons/traffic-users.svg",
            label: "Total Leads",
            value: 5,
            colorClass: "green",
        },
        {
            icon: "./assets/images/icons/traffic-message-square.svg",
            label: "Total Chats",
            value: 3,
            colorClass: "purple",
        },
        {
            icon: "./assets/images/icons/traffic-shopping-cart.svg",
            label: "Total Orders",
            value: 7,
            colorClass: "orange",
        },
        {
            icon: "./assets/images/icons/traffic-logout.svg",
            label: "Total Logins",
            value: 19,
            colorClass: "blue",
        },
    ];

    leadDetail = {
        referrerName: "John Davis",
        trackingCode: "johndavis",
        dealAmount: "$1,500.00",
        firstVisit: "May 23, 2025 22:30",
        lastModified: "May 23, 2025 22:30",
    };

    utmData = {
        campaign: "Googlr",
        channel: "PPC",
        source: "google",
        medium: "ppc",
        content: "directory-listing",
        term: "adult-daycare",
    };

    locationData = {
        ipAddress: "192.168.1.45",
        city: "Sulphur Springs",
        region: "Texas",
        country: "United States of America (US)",
        coordinates: { lat: 33.147662, lng: -95.295859 },
        ispProvider: "ASN-CXA-ALL-CCI-22773-RDC",
        connectionType: "4G",
    };

    deviceSessionData = {
        deviceType: "Desktop",
        operatingSystem: "Windows",
        platformArchitecture: "x86_64",
        connectionType: "4G",
        webBrowser: "Google Chrome",
        screenResolution: "1920x1080",
        language: "en-US",
        timezone: "America/Chicago",
    };

    urlInfo = {
        entryUrl:
            "https://preview--golden-years-locator.lovable.app/visitor-details?utm_source=google&utm_medium=ppc&utm_campaign=Google&utm_channel=PPC",
        referringUrl: "https://www.referring-domain.com/somepage.php",
        userAgent:
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome",
    };

    visits = [
        {
            id: 50,
            date: "6/4/2025",
            time: "2:04:37 AM",
            duration: "8m 11s",
            pages: 7,
            ip: "192.168.1.45",
            user: "johndavis",
            countryCode: "us",
            isCurrent: true,
        },
        {
            id: 49,
            date: "6/3/2025",
            time: "2:01:12 AM",
            duration: "3m 46s",
            pages: 5,
            ip: "10.0.0.123",
            user: "johndavis",
            countryCode: "ca",
        },
        {
            id: 48,
            date: "6/2/2025",
            time: "1:58:02 AM",
            duration: "3m 17s",
            pages: 6,
            ip: "172.16.0.89",
            user: "johndavis",
            countryCode: "gb",
        },
        {
            id: 47,
            date: "6/1/2025",
            time: "2:05:43 AM",
            duration: "7m 29s",
            pages: 8,
            ip: "203.0.113.195",
            user: "johndavis",
            countryCode: "de",
        },
        {
            id: 46,
            date: "5/31/2025",
            time: "2:07:21 AM",
            duration: "2m 51s",
            pages: 1,
            ip: "198.51.100.42",
            user: "johndavis",
            countryCode: "fr",
        },
        {
            id: 45,
            date: "5/30/2025",
            time: "2:04:00 AM",
            duration: "2m 27s",
            pages: 7,
            ip: "192.168.1.45",
            user: "johndavis",
            countryCode: "au",
        },
        {
            id: 44,
            date: "5/29/2025",
            time: "1:44:14 AM",
            duration: "4m 05s",
            pages: 6,
            ip: "203.0.113.112",
            user: "johndavis",
            countryCode: "in",
        },
        {
            id: 43,
            date: "5/28/2025",
            time: "3:14:57 AM",
            duration: "6m 10s",
            pages: 9,
            ip: "185.34.45.78",
            user: "johndavis",
            countryCode: "nl",
        },
        {
            id: 42,
            date: "5/27/2025",
            time: "4:02:01 AM",
            duration: "1m 42s",
            pages: 2,
            ip: "102.129.32.90",
            user: "johndavis",
            countryCode: "za",
        },
        {
            id: 41,
            date: "5/26/2025",
            time: "2:33:13 AM",
            duration: "5m 00s",
            pages: 5,
            ip: "82.45.200.55",
            user: "johndavis",
            countryCode: "ie",
        },
        {
            id: 40,
            date: "5/25/2025",
            time: "2:14:21 AM",
            duration: "2m 23s",
            pages: 3,
            ip: "203.12.55.21",
            user: "johndavis",
            countryCode: "nz",
        },
        {
            id: 39,
            date: "5/24/2025",
            time: "2:04:37 AM",
            duration: "4m 12s",
            pages: 6,
            ip: "91.105.97.33",
            user: "johndavis",
            countryCode: "pl",
        },
        {
            id: 38,
            date: "5/23/2025",
            time: "1:54:00 AM",
            duration: "3m 33s",
            pages: 4,
            ip: "58.140.221.11",
            user: "johndavis",
            countryCode: "kr",
        },
        {
            id: 37,
            date: "5/22/2025",
            time: "1:48:17 AM",
            duration: "2m 17s",
            pages: 2,
            ip: "121.89.41.11",
            user: "johndavis",
            countryCode: "cn",
        },
        {
            id: 36,
            date: "5/21/2025",
            time: "1:41:59 AM",
            duration: "1m 55s",
            pages: 3,
            ip: "192.0.2.50",
            user: "johndavis",
            countryCode: "jp",
        },
    ];
    currentDateTime: string;

    ngOnInit(): void {
        const now = new Date();
        this.currentDateTime = now.toLocaleString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        });
    }
}
