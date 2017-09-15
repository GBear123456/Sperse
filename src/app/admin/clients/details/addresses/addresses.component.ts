import { Component, OnInit } from '@angular/core';
import { MdDialog, MdDialogRef } from '@angular/material';

@Component({
  selector: 'addresses',
  templateUrl: './addresses.component.html',
  styleUrls: ['./addresses.component.less']
})
export class AddressesComponent implements OnInit {
  person_addresses = [
    {
        'title': 'Primary Residential Address',
        'description': 'Lorem ipsum dolor sit amet. conse ctetur adippiscing',
        'location': 'Austin, Texas',
        'icon': 'home'
    },
    {
        'title': 'Previous Home',
        'description': 'Lorem ipsum dolor sit amet. conse ctetur adippiscing',
        'location': 'Austin, Texas',
        'icon': 'arrow-left'
    },
    {
        'title': 'Shipping Address',
        'description': 'Lorem ipsum dolor sit amet. conse ctetur adippiscing',
        'location': 'Austin, Texas',
        'icon': 'truck'
    }
  ];

  constructor(
    public dialog: MdDialog
  ) { }

  ngOnInit() {
      //this.person_addresses = this.PersonService.getPersonAddresses();      
  }

  addAddress() {
 }

}
