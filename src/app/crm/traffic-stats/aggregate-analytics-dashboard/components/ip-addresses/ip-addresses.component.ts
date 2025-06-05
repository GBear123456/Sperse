import { Component, OnInit } from "@angular/core";

@Component({
    selector: "app-aggregate-analytics-ip-addresses",
    templateUrl: "./ip-addresses.component.html",
    styleUrls: ["./ip-addresses.component.less"],
})
export class IpAddressesComponent implements OnInit {
    constructor() {}

    ngOnInit(): void {}
    topIps = [
        {
            id: 1,
            ip: "203.0.113.45",
            location: "US • Comcast Cable",
            count: 2847,
            percent: "8.2%",
        },
        {
            id: 2,
            ip: "198.51.100.22",
            location: "CA • Bell Canada",
            count: 1934,
            percent: "5.6%",
        },
        {
            id: 3,
            ip: "192.0.2.156",
            location: "GB • British Telecom",
            count: 1567,
            percent: "4.5%",
        },
        {
            id: 4,
            ip: "203.0.113.78",
            location: "AU • Telstra",
            count: 1234,
            percent: "3.6%",
        },
        {
            id: 5,
            ip: "198.51.100.99",
            location: "DE • Deutsche Telekom",
            count: 987,
            percent: "2.8%",
        },
        {
            id: 6,
            ip: "192.0.2.201",
            location: "FR • Orange",
            count: 756,
            percent: "2.2%",
        },
        {
            id: 7,
            ip: "203.0.113.33",
            location: "NL • KPN",
            count: 634,
            percent: "1.8%",
        },
        {
            id: 8,
            ip: "198.51.100.144",
            location: "JP • NTT",
            count: 523,
            percent: "1.5%",
        },
    ];

    openIpLookup(ip: string) {
        window.open("https://search.arin.net/rdap/?query=" + ip, "_blank");
    }
}
