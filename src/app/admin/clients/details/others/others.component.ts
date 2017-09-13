import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'others',
  templateUrl: './others.component.html',
  styleUrls: ['./others.component.less']
})
export class OthersComponent implements OnInit {

  others = [
    {
        'url': 'http://github.com/mrobertson',
        'icon': 'github'
    },
    {
        'url': 'http://dribbble.com/matthewrob',
        'icon': 'dribbble'
    },
    {
        'url': 'http://dribbble.com/metthew1982',
        'icon': 'youtube-play'
    }
  ];

  constructor() { }

  ngOnInit() {
//    this.others = this.PersonService.getOthers();
  }

}
