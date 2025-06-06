import { Component, OnInit } from "@angular/core";

@Component({
    selector: "app-hourly-traffic-heatmap",
    templateUrl: "./hourly-traffic-heatmap.component.html",
})
export class HourlyTrafficHeatmapComponent implements OnInit {
    constructor() {}

    ngOnInit(): void {}

    days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    trafficData = this.generateHourlyData();

    getColor(value: number): string {
        if (value <= 20) return "#cbd5e1"; // low (gray)
        if (value <= 40) return "#60a5fa"; // blue
        if (value <= 60) return "#f59e0b"; // amber
        if (value <= 75) return "#ec4899"; // pink
        return "#ef4444"; // high (red)
    }

    private generateHourlyData() {
        const data = [];
        for (let h = 0; h < 24; h++) {
            const hourLabel = h.toString().padStart(2, "0") + ":00";
            const values = Array.from(
                { length: 7 },
                () => Math.floor(Math.random() * 80) + 10 // Random 10–89
            );
            data.push({ hour: hourLabel, values });
        }
        return data;
    }
}
