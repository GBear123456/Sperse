export class HeadLineConfigModel {
  names: string[];
  text?: string;
  icon?: string;
  iconSrc?: string;
  class?: string;
  buttons: any[];
  onRefresh: () => void;
}
