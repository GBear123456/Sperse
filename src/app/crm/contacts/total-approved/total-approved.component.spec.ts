import { async, ComponentFixture, TestBed } from '@angular/core/testing';


import { TotalApprovedComponent } from './total-approved.component';

describe('PersonTotalApprovedComponent', () => {
  let component: TotalApprovedComponent;
  let fixture: ComponentFixture<TotalApprovedComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TotalApprovedComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TotalApprovedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
