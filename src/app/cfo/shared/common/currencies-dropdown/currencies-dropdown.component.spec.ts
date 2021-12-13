import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CurrenciesDropdownComponent } from './currencies-dropdown.component';

describe('CurrenciesDropdownComponent', () => {
  let component: CurrenciesDropdownComponent;
  let fixture: ComponentFixture<CurrenciesDropdownComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CurrenciesDropdownComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CurrenciesDropdownComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
