import { Component, OnInit } from '@angular/core';
import { DataLayoutType } from '@app/shared/layout/data-layout-type';

@Component({
  selector: 'operations-widget',
  templateUrl: './operations-widget.component.html',
  styleUrls: ['./operations-widget.component.less']
})
export class OperationsWidgetComponent implements OnInit {
  private dataLayoutType: DataLayoutType = DataLayoutType.Pipeline;
  
  toggleDataLayout(dataLayoutType) {
    this.dataLayoutType = dataLayoutType;
  }

  toolbarConfig = [
    {location: 'before', items: [
      {name: 'assign'}, {name: 'status'}, {name: 'delete'}
    ]},
    {location: 'center', items: [
      {name: 'folder'}, {name: 'pen'}
    ]}
  ];

  constructor() { }

  ngOnInit() {
  }

}
