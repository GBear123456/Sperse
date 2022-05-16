import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ClientScoresComponent } from './client-scores.component';

describe('ClientScoresComponent', () => {
  let component: ClientScoresComponent;
  let fixture: ComponentFixture<ClientScoresComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ClientScoresComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ClientScoresComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
