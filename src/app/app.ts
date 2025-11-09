import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HlmToaster } from '@spartan-ng/helm/sonner';
import { HeaderComponent } from './shared/components/header.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, HlmToaster],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('Meu Ponto');
}
