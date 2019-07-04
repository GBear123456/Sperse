import { Component, OnInit } from '@angular/core';

@Component({
    selector: 'app-bank-code-wizzard-tabs',
    templateUrl: './bank-code-wizzard-tabs.component.html',
    styleUrls: ['./bank-code-wizzard-tabs.component.less']
})
export class BankCodeWizzardTabsComponent implements OnInit {
    tabLoadTimes: Date[] = [];
    
    getTimeLoaded(index: number) {
        if (!this.tabLoadTimes[index]) {
            this.tabLoadTimes[index] = new Date();
        }
        
        return this.tabLoadTimes[index];
    }
    
    constructor() {
    }
    
    ngOnInit() {
    }
    
}
