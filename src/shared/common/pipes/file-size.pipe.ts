import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'filesize'
})
export class FileSizePipe implements PipeTransform {
  transform(sizeBytes, args) {
      let kb = 1024;

      if (sizeBytes < kb) {
        return sizeBytes + ' bytes';
      } else if ((sizeBytes / kb) < kb) {
        return Math.round(sizeBytes / kb) + ' Kb';
      } {
        return Math.round(sizeBytes / kb / kb) + ' Mb';
      }
  }
}
