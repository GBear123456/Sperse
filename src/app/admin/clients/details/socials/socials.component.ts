import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'socials',
  templateUrl: './socials.component.html',
  styleUrls: ['./socials.component.less']
})
export class SocialsComponent implements OnInit {

  socials = [
    {
        'icon': 'facebook-official',
        'url': 'https://facebook.com'
    },
    {
        'icon': 'twitter',
        'url': 'https://twitter.com'
    },
    {
        'icon': 'pinterest',
        'url': 'https://pinterest.com'
    }
  ];
  
  constructor() { }

  ngOnInit() {
//    this.socials = this.PersonService.getSocials();
  }

}
