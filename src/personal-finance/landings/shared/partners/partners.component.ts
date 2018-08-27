import { Component, Injector, OnInit} from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';

@Component({
  selector: 'app-partners-list',
  templateUrl: 'partners.component.html',
  styleUrls: ['partners.component.less']
})

export class PartnersComponent extends AppComponentBase implements OnInit {
  images = [
    {src: '/assets/landing/kabbage-logo.png', title: 'kabbage'},
    {src: '/assets/landing/ondeck-logo.png', title: 'ondeck'},
    {src: '/assets/landing/equafix-logo.png', title: 'equafix'},
    {src: '/assets/landing/lendingtree-logo.png', title: 'lendingtree'},
    {src: '/assets/landing/paychex-logo.png', title: 'paychex'},
    {src: '/assets/landing/paychex-logo.png', title: 'paychex'},
    {src: '/assets/landing/equafix-logo.png', title: 'equafix'},
    {src: '/assets/landing/ondeck-logo.png', title: 'ondeck'},
    {src: '/assets/landing/kabbage-logo.png', title: 'kabbage'},
    {src: '/assets/landing/lendingtree-logo.png', title: 'lendingtree'}
  ];

  constructor(
    injector: Injector
  ) {
    super(injector);
  }

  ngOnInit() { }
}
