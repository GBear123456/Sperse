import { Observable } from 'rxjs';

export interface LeftMenuItem {
  name?: string;
  caption: string;
  component?: string;
  iconSrc: string;
  visible?: boolean | Observable<boolean>;
  disabled?: boolean;
  showPlus?: boolean;
  isModalDialog?: boolean;
  onClick?: (item: LeftMenuItem) => any;
  data?: { [name: string]: any };
}
