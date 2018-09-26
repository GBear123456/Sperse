import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';

@Component({
  selector: 'not-found',
  templateUrl: './not-found.component.html',
  styleUrls: ['./not-found.component.less']
})
export class NotFoundComponent implements OnInit {

    constructor(private _location: Location) { }

    ngOnInit() {
    }

    goBack() {
        this._location.back();
    }
}
