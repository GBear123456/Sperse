/** Core imports */
import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
} from '@angular/core';

/** Third party imports */
import { Search } from 'lucide-angular';

@Component({
  selector: 'search-bar',
  templateUrl: './search-bar.component.html',
  styleUrls: ['./search-bar.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchBarComponent implements OnInit {
  readonly SearchIcon = Search;

  @Input() placeholder: string;
  @Input() isDarkMode: boolean;
  @Input() searchQuery: string;
  @Output() searchQueryChange: EventEmitter<string> = new EventEmitter<string>();

  constructor() {}

  ngOnInit(): void {}

  clearSearch = () => {
    this.searchQueryChange.emit('');
  };

  onChange = (value: string) => {
    this.searchQueryChange.emit(value);
  };
}
