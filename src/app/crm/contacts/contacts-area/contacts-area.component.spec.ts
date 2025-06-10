import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ContactsAreaComponent } from './contacts-area.component';

describe('ContactsAreaComponent', () => {
  let component: ContactsAreaComponent;
  let fixture: ComponentFixture<ContactsAreaComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ContactsAreaComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ContactsAreaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
