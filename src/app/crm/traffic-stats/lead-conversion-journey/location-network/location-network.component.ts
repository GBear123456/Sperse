import { Component, OnInit, Input } from "@angular/core";

@Component({
    selector: "app-location-network",
    templateUrl: "./location-network.component.html",
    styleUrls: ["./location-network.component.less"],
})
export class LocationNetworkComponent implements OnInit {
    @Input() ipAddress!: string;
    @Input() city!: string;
    @Input() region!: string;
    @Input() country!: string;
    @Input() coordinates!: { lat: number; lng: number };
    @Input() ispProvider!: string;
    @Input() connectionType!: string;

    constructor() {}

    ngOnInit(): void {}

    get googleMapsUrl(): string {
        return `https://www.google.com/maps/search/?api=1&query=${this.coordinates.lat},${this.coordinates.lng}`;
    }
}
