import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'contacts',
  templateUrl: './contacts.component.html',
  styleUrls: ['./contacts.component.less']
})
export class ContactsComponent implements OnInit {

  emails = [
    'super@mail.com', 'mr@sperse.com'
  ];
  phones = {
    'mobile': {
        'phone': '+123 456 789 012'
    },
    'home': {
        'phone': '+123 456 789 012'
    },
    'office': {
        'phone': '+123 456 789 012'
    }
  };
  
  constructor() { }

  ngOnInit() {
//    this.emails = this.PersonService.getEmails();
//    this.phones = this.PersonService.getPhones();
  }

}
