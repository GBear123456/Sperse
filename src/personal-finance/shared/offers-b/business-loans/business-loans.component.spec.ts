import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BusinessLoansComponent } from './business-loans.component';

describe('BusinessLoansComponent', () => {
  let component: BusinessLoansComponent;
  let fixture: ComponentFixture<BusinessLoansComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BusinessLoansComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BusinessLoansComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
