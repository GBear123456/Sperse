import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'operations-widget',
  templateUrl: './operations-widget.component.html',
  styleUrls: ['./operations-widget.component.less']
})
export class OperationsWidgetComponent implements OnInit {
  toolbarConfig=[
    {location: 'before', items: [
      {name: 'back'}
    ]},
    {location: 'before', items: [
      {name: 'assign'}, {name: 'status'}, {name: 'delete'}
    ]},
    {location: 'center', items: [
      {name: 'folder'}, {name: 'pen'}
    ]},
    {location: 'center', items: [
      {name: 'more'}
    ]},
    {location: 'after', items: [
      {name: 'box'}, {name: 'pipeline'}, {name: 'grid'}
    ]},
    {location: 'after', items: [
      {name: 'prev'}, {name: 'next'}
    ]}
  ];

  constructor() { }

  ngOnInit() {
  }

}
