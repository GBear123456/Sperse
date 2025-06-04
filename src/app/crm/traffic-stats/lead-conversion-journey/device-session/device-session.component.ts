import { Component, OnInit, Input } from "@angular/core";

@Component({
    selector: "app-device-session",
    templateUrl: "./device-session.component.html",
    styleUrls: ["./device-session.component.less"],
})
export class DeviceSessionComponent implements OnInit {
    @Input() deviceType!: string;
    @Input() operatingSystem!: string;
    @Input() platformArchitecture!: string;
    @Input() connectionType!: string;
    @Input() webBrowser!: string;
    @Input() screenResolution!: string;
    @Input() language!: string;
    @Input() timezone!: string;

    constructor() {}

    ngOnInit(): void {}
}
