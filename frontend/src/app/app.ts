import { Component, HostListener, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Footer } from './shared/footer/footer';
import { Navbar } from './shared/navbar/navbar';
import { Offline } from './pages/public/offline/offline';

@Component({
  imports: [RouterOutlet, Navbar, Footer, Offline],
  selector: 'app-root',
  templateUrl: './app.html',
})
export class App {
  online = signal(navigator.onLine);

  @HostListener('window:online')
  onOnline(): void {
    this.online.set(true);
  }

  @HostListener('window:offline')
  onOffline(): void {
    this.online.set(false);
  }
}
