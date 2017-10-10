import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CashflowTableComponent } from './cashflow-table.component';

describe('CashflowTableComponent', () => {
  let component: CashflowTableComponent;
  let fixture: ComponentFixture<CashflowTableComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CashflowTableComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CashflowTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
