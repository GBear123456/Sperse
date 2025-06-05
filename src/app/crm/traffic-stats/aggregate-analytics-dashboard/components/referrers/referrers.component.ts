import { Component, OnInit } from "@angular/core";

@Component({
    selector: "app-aggregate-analytics-referrers",
    templateUrl: "./referrers.component.html",
    styleUrls: ["./referrers.component.less"],
})
export class ReferrersComponent implements OnInit {
    constructor() {}

    ngOnInit(): void {}
    sources = [
        {
            name: "google.com",
            type: "Search Engine",
            value: 2847,
            percent: "42.3%",
            typeClass: "bg-blue-100 text-blue-800",
        },
        {
            name: "facebook.com",
            type: "Social Media",
            value: 1234,
            percent: "18.4%",
            typeClass: "bg-purple-100 text-purple-800",
        },
        {
            name: "caregiving-forum.com",
            type: "Website",
            value: 892,
            percent: "13.3%",
            typeClass: "bg-green-100 text-green-800",
        },
        {
            name: "bing.com",
            type: "Search Engine",
            value: 567,
            percent: "8.4%",
            typeClass: "bg-blue-100 text-blue-800",
        },
        {
            name: "linkedin.com",
            type: "Social Media",
            value: 434,
            percent: "6.5%",
            typeClass: "bg-purple-100 text-purple-800",
        },
        {
            name: "eldercare-resources.org",
            type: "Website",
            value: 378,
            percent: "5.6%",
            typeClass: "bg-green-100 text-green-800",
        },
        {
            name: "yahoo.com",
            type: "Search Engine",
            value: 234,
            percent: "3.5%",
            typeClass: "bg-blue-100 text-blue-800",
        },
        {
            name: "twitter.com",
            type: "Social Media",
            value: 156,
            percent: "2.3%",
            typeClass: "bg-purple-100 text-purple-800",
        },
    ];
    get uniqueSources() {
        const seen = new Set();
        return this.sources.filter((src) => {
            if (seen.has(src.name)) return false;
            seen.add(src.name);
            return true;
        });
    }
}
