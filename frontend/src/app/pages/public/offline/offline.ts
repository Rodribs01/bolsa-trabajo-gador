import { Component } from '@angular/core';

@Component({
  selector: 'app-offline',
  templateUrl: './offline.html',
})
export class Offline {
  retry(): void {
    window.location.reload();
  }
}
