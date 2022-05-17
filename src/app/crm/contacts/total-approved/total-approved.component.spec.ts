import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';


import { TotalApprovedComponent } from './total-approved.component';

describe('PersonTotalApprovedComponent', () => {
  let component: TotalApprovedComponent;
  let fixture: ComponentFixture<TotalApprovedComponent>;

  beforeEach(waitForAsync(() => {
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
