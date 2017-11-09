export class ToolbarGroupModel {
  location: string;
  items: {
    name: string,
    action: () => void,
    options: object
  }[];
}
