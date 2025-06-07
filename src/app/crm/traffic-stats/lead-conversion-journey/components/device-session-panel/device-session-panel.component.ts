import { Component, OnInit } from "@angular/core";

@Component({
    selector: "app-device-session-panel",
    templateUrl: "./device-session-panel.component.html",
})
export class DeviceSessionPanelComponent implements OnInit {
    constructor() {}

    ngOnInit(): void {}

    fields = [
        { label: "Device Type", value: "Desktop", icon: "monitor" },
        { label: "Operating System", value: "Windows", icon: "laptop" },
        { label: "Platform Architecture", value: "Win32", icon: "server" },
        { label: "Connection Type", value: "4G", icon: "globe" },
        { label: "Web Browser", value: "Chrome 136.0.0.0", icon: "globe" },
        { label: "Screen Resolution", value: "1646x1029", icon: "monitor" },
        { label: "Language", value: "en-US", icon: "languages" },
        { label: "Timezone", value: "America/Phoenix", icon: "clock" },
    ];
}
