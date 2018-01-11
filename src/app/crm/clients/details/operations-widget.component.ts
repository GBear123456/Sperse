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
    {                
      location: 'after', 
      areItemsDependent: true,
      items: [
          { 
              name: 'box',
              action: this.toggleDataLayout.bind(this, DataLayoutType.Box),
              options: {
                  checkPressed: () => {
                      return (this.dataLayoutType == DataLayoutType.Box);
                  },
              }
          },
          { 
              name: 'pipeline', 
              action: this.toggleDataLayout.bind(this, DataLayoutType.Pipeline),
              options: {
                  checkPressed: () => {
                      return (this.dataLayoutType == DataLayoutType.Pipeline);
                  },
              }
          },
          { 
              name: 'grid', 
              action: this.toggleDataLayout.bind(this, DataLayoutType.Grid),
              options: {
                  checkPressed: () => {
                      return (this.dataLayoutType == DataLayoutType.Grid);
                  },
              } 
          }
      ]
    },
    {location: 'after', items: [
      {name: 'prev'}, {name: 'next'}
    ]}
  ];

  constructor() { }

  ngOnInit() {
  }

}
