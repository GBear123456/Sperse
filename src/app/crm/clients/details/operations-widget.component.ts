import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'operations-widget',
  templateUrl: './operations-widget.component.html',
  styleUrls: ['./operations-widget.component.less']
})
export class OperationsWidgetComponent implements OnInit {
  items = [{
      location: 'before',
      widget: 'dxButton',
      options: {
          hint: 'Back',
          iconSrc: 'assets/common/icons/back-arrow.svg',
          onClick: Function()
      }
  }, {
      location: 'before',
      widget: 'dxButton',
      options: {
          text: 'Assign',
          iconSrc: 'assets/common/icons/assign-icon.svg',
          onClick: Function()
      }
  }, {
      location: 'before',
      widget: 'dxButton',
      options: {
          text: 'Status',
          iconSrc: 'assets/common/icons/status-icon.svg',
          onClick: Function()
      }
  }, {
      location: 'before',
      widget: 'dxButton',
      options: {
          text: 'Delete',
          iconSrc: 'assets/common/icons/delete-icon.svg',
          onClick: Function()
      }
  }, {
      location: 'center',
      widget: 'dxButton',
      options: {
          iconSrc: 'assets/common/icons/folder.svg',
          onClick: Function()
      }
  }, {
      location: 'center',
      widget: 'dxButton',
      options: {
          iconSrc: 'assets/common/icons/pen.svg',
          onClick: Function()
      }
  }, {
      location: 'center',
      widget: 'dxButton',
      options: {
          text: 'More',
          onClick: Function()
      }
  }, {
      location: 'after',
      widget: 'dxButton',
      options: {
          hint: 'Box',
          iconSrc: 'assets/common/icons/box-icon.svg',
          onClick: Function()
      }
  }, {
      location: 'after',
      widget: 'dxButton',
      options: {
          hint: 'Pipeline',
          iconSrc: 'assets/common/icons/pipeline-icon.svg',
          onClick: Function()
      }
  }, {
      location: 'after',
      widget: 'dxButton',
      options: {
          hint: 'Grid',
          iconSrc: 'assets/common/icons/table-icon.svg',
          onClick: Function()
      }
  }, {
      location: 'after',
      widget: 'dxButton',
      options: {
          icon: 'chevronprev',
          onClick: Function()
      }
  }, {
      location: 'after',
      widget: 'dxButton',
      options: {
          icon: 'chevronnext',
          onClick: Function()
      }
  }];

  constructor() { }

  ngOnInit() {
  }

}
