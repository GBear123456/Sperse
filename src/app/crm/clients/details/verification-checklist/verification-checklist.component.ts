import { Component, OnInit } from '@angular/core';

@Component({
    selector: 'verification-checklist',
    templateUrl: './verification-checklist.component.html',
    styleUrls: ['./verification-checklist.component.less']
})
export class VerificationChecklistComponent implements OnInit {
    checklist = [
        {
            name: 'Full name verified',
            status: 'success'
        },
        {
            name: 'Email verified',
            status: 'success'            
        },
        {
            name: 'Phone verified',
            status: 'success'            
        },
        {
            name: 'Address verified',
            status: 'unsuccess'            
        },
        {
            name: 'Employment verification',
            status: 'pending'            
        },
        {
            name: 'Income verification',
            status: 'unsuccess'            
        }
    ];
    personal_checklist_collapsed: boolean = false;

    constructor() { }

    ngOnInit() {
    }

    getCheckStyle(status) {
        let style = '';
        switch (status) {
            case 'success':
                style = 'check';
                break;
            case 'unsuccess':
                style = 'times';
                break;
            case 'pending':
                style = 'square';
                break;
            default:
                style = 'square';
        }
        return style;
    }

    changeCollapseStatus() {
        this.personal_checklist_collapsed = !this.personal_checklist_collapsed;
    }
}
