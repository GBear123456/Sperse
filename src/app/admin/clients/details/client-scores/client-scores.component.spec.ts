import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientScoresComponent } from './client-scores.component';

describe('ClientScoresComponent', () => {
  let component: ClientScoresComponent;
  let fixture: ComponentFixture<ClientScoresComponent>;

  beforeEach(async(() => {
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
