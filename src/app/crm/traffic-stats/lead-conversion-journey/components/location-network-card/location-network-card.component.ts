import { Component, OnInit } from "@angular/core";

@Component({
    selector: "app-location-network-card",
    templateUrl: "./location-network-card.component.html",
})
export class LocationNetworkCardComponent implements OnInit {
    constructor() {}

    ngOnInit(): void {}

    fields = [
        { label: "IP Address", value: "192.168.1.45", icon: "network" },
        {
            label: "City & Region",
            value: "Sulphur Springs, Texas",
            icon: "map-pin",
        },
        {
            label: "Country",
            value: "United States of America (US)",
            icon: "globe",
        },
        {
            label: "Coordinates",
            value: "33.147662, -95.295859 ±15.683",
            icon: "navigation",
        },
        {
            label: "ISP Provider",
            value: "ASN-CXA-ALL-CCI-22773-RDC",
            icon: "wifi",
        },
        { label: "Connection Type", value: "4G", icon: "rss" },
    ];

    getGoogleMapsLink(): string {
        const coords = "33.147662,-95.295859";
        return `https://www.google.com/maps?q=${coords}`;
    }
}
