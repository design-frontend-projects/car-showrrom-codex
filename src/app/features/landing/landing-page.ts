import { isPlatformBrowser, NgClass } from '@angular/common';
import { Component, DestroyRef, OnInit, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { firstValueFrom } from 'rxjs';
import { ResponsiveLayoutService } from '../../core/layout/responsive-layout.service';
import { CatalogApiService } from '../../core/showroom/catalog-api.service';
import { VehicleInventoryCountersDto } from '../../core/showroom/showroom.models';
import { UiSignalStore } from '../../state/ui-signal.store';
import { formatCurrency, formatMileage } from '../../utils/number-format.util';

@Component({
  selector: 'app-landing-page',
  imports: [ButtonModule, FormsModule, InputTextModule, RouterLink, TranslatePipe, NgClass],
  template: `
    <!-- Hero Section -->
    <section class="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-zinc-950" [attr.data-density]="heroDensity()">
      <!-- Background Image with Overlay -->
      <div class="absolute inset-0 z-0">
        <div class="absolute inset-0 bg-gradient-to-b from-zinc-950/60 via-zinc-950/80 to-zinc-950 z-10"></div>
        <img 
          src="https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?q=80&w=2669&auto=format&fit=crop" 
          alt="Luxury Car Showroom" 
          class="w-full h-full object-cover opacity-60"
        />
      </div>

      <div class="relative z-10 container mx-auto px-6 py-20 mt-12 flex flex-col items-center text-center animate-fade-in-up">
        <span class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-sm font-semibold uppercase tracking-wider mb-6">
          <i class="pi pi-verified"></i> {{ 'landing.kicker' | translate }}
        </span>
        
        <h1 class="text-5xl md:text-7xl font-bold text-white tracking-tight leading-tight mb-6 max-w-4xl">
          Find Your Dream Car or <span class="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Sell With Ease</span>
        </h1>
        
        <p class="text-lg md:text-xl text-zinc-300 max-w-2xl mb-12">
          Experience a premium automotive journey. Whether you are looking for an exclusive exotic or a certified pre-owned vehicle, we provide transparent and seamless transactions.
        </p>

        <!-- CTA Buttons -->
        <div class="flex flex-col sm:flex-row gap-4 mb-16 w-full sm:w-auto">
          <a routerLink="/used-cars" class="p-button p-component p-button-lg bg-blue-600 hover:bg-blue-500 border-none text-white px-8 py-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/20">
            <i class="pi pi-search text-lg"></i> Browse Inventory
          </a>
          <a routerLink="/services" class="p-button p-component p-button-lg p-button-outlined bg-zinc-900/50 hover:bg-zinc-800 text-white border-zinc-700 px-8 py-4 rounded-lg font-semibold flex items-center justify-center gap-2 backdrop-blur-md transition-all">
            <i class="pi pi-tag text-lg"></i> Sell Your Car
          </a>
        </div>

        <!-- Floating Search Bar -->
        <div class="w-full max-w-3xl bg-zinc-900/60 backdrop-blur-xl border border-zinc-700/50 rounded-2xl p-3 shadow-2xl">
          <form class="flex flex-col md:flex-row gap-3" (ngSubmit)="submitSearch()">
            <div class="p-input-icon-left flex-1 relative flex items-center">
              <i class="pi pi-car absolute left-4 text-zinc-400 z-10"></i>
              <input 
                pInputText 
                type="search" 
                class="w-full bg-zinc-800/50 border-none text-white placeholder:text-zinc-500 pl-11 py-4 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all"
                [placeholder]="'landing.searchPlaceholder' | translate" 
                name="landingSearch" 
                [ngModel]="ui.searchTerm()" 
                (ngModelChange)="ui.updateSearchTerm($event)"
              />
            </div>
            <button type="submit" class="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl font-medium transition-colors md:w-auto w-full">
              {{ 'landing.search' | translate }}
            </button>
          </form>
        </div>
      </div>
    </section>

    <!-- Stats & Inventory Highlight -->
    <section class="bg-zinc-950 py-12 border-b border-zinc-800">
      <div class="container mx-auto px-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-zinc-800">
          <div class="py-4">
            <div class="text-4xl font-bold text-white mb-2">500+</div>
            <div class="text-zinc-400 uppercase tracking-wider text-sm font-semibold">Premium Vehicles</div>
          </div>
          <div class="py-4">
            <div class="text-4xl font-bold text-blue-400 mb-2">{{ counters()?.usedCars || '...' }}</div>
            <div class="text-zinc-400 uppercase tracking-wider text-sm font-semibold">{{ 'nav.usedCars' | translate }}</div>
          </div>
          <div class="py-4">
            <div class="text-4xl font-bold text-emerald-400 mb-2">{{ counters()?.newCars || '...' }}</div>
            <div class="text-zinc-400 uppercase tracking-wider text-sm font-semibold">{{ 'nav.newCars' | translate }}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- How It Works Section -->
    <section class="py-24 bg-zinc-50 dark:bg-[#191919]">
      <div class="container mx-auto px-6">
        <div class="text-center mb-16">
          <span class="text-blue-600 dark:text-blue-400 font-semibold tracking-wider uppercase text-sm mb-2 block">Simplified Process</span>
          <h2 class="text-4xl font-bold text-zinc-900 dark:text-white">Seamless Buying & Selling</h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-24 max-w-6xl mx-auto">
          <!-- Buy Process -->
          <div class="bg-white dark:bg-[#202020] rounded-3xl p-8 lg:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-zinc-100 dark:border-[#2f2f2f]">
            <div class="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-8">
              <i class="pi pi-shopping-bag text-2xl"></i>
            </div>
            <h3 class="text-2xl font-bold mb-6 text-zinc-900 dark:text-white">Buy a Vehicle</h3>
            <ul class="space-y-6">
              <li class="flex items-start gap-4">
                <div class="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold shrink-0">1</div>
                <div>
                  <h4 class="font-semibold text-zinc-900 dark:text-white mb-1">Browse Inventory</h4>
                  <p class="text-zinc-500 dark:text-zinc-400 text-sm">Explore our curated selection of premium pre-owned and new vehicles.</p>
                </div>
              </li>
              <li class="flex items-start gap-4">
                <div class="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold shrink-0">2</div>
                <div>
                  <h4 class="font-semibold text-zinc-900 dark:text-white mb-1">Schedule a Test Drive</h4>
                  <p class="text-zinc-500 dark:text-zinc-400 text-sm">Book an appointment to experience the car firsthand.</p>
                </div>
              </li>
              <li class="flex items-start gap-4">
                <div class="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold shrink-0">3</div>
                <div>
                  <h4 class="font-semibold text-zinc-900 dark:text-white mb-1">Drive Home</h4>
                  <p class="text-zinc-500 dark:text-zinc-400 text-sm">Complete the paperwork smoothly and drive away in your dream car.</p>
                </div>
              </li>
            </ul>
          </div>

          <!-- Sell Process -->
          <div class="bg-white dark:bg-[#202020] rounded-3xl p-8 lg:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-zinc-100 dark:border-[#2f2f2f]">
            <div class="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-8">
              <i class="pi pi-dollar text-2xl"></i>
            </div>
            <h3 class="text-2xl font-bold mb-6 text-zinc-900 dark:text-white">Sell Your Vehicle</h3>
            <ul class="space-y-6">
              <li class="flex items-start gap-4">
                <div class="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-700 dark:text-emerald-300 font-bold shrink-0">1</div>
                <div>
                  <h4 class="font-semibold text-zinc-900 dark:text-white mb-1">Get an Instant Quote</h4>
                  <p class="text-zinc-500 dark:text-zinc-400 text-sm">Provide your vehicle details and receive a competitive offer in minutes.</p>
                </div>
              </li>
              <li class="flex items-start gap-4">
                <div class="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-700 dark:text-emerald-300 font-bold shrink-0">2</div>
                <div>
                  <h4 class="font-semibold text-zinc-900 dark:text-white mb-1">Free Inspection</h4>
                  <p class="text-zinc-500 dark:text-zinc-400 text-sm">Our experts will verify your car's condition at your convenience.</p>
                </div>
              </li>
              <li class="flex items-start gap-4">
                <div class="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-700 dark:text-emerald-300 font-bold shrink-0">3</div>
                <div>
                  <h4 class="font-semibold text-zinc-900 dark:text-white mb-1">Get Paid Instantly</h4>
                  <p class="text-zinc-500 dark:text-zinc-400 text-sm">Receive secure payment immediately upon handover.</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- Client Testimonials -->
    <section class="py-24 bg-white dark:bg-[#141414]">
      <div class="container mx-auto px-6">
        <div class="text-center mb-16">
          <span class="text-blue-600 dark:text-blue-400 font-semibold tracking-wider uppercase text-sm mb-2 block">Client Reviews</span>
          <h2 class="text-4xl font-bold text-zinc-900 dark:text-white mb-4">What Our Customers Say</h2>
          <p class="text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto">Don't just take our word for it. Here is what people have to say about their experience with our showroom.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          @for (review of testimonials; track review.name) {
            <div class="bg-zinc-50 dark:bg-[#202020] rounded-2xl p-8 border border-zinc-100 dark:border-[#2f2f2f] flex flex-col h-full hover:-translate-y-1 transition-transform duration-300">
              <div class="flex items-center gap-1 text-yellow-400 mb-4">
                <i class="pi pi-star-fill"></i>
                <i class="pi pi-star-fill"></i>
                <i class="pi pi-star-fill"></i>
                <i class="pi pi-star-fill"></i>
                <i class="pi pi-star-fill"></i>
              </div>
              <p class="text-zinc-600 dark:text-zinc-300 mb-8 flex-1 italic">"{{ review.comment }}"</p>
              <div class="flex items-center gap-4 mt-auto">
                <div class="w-12 h-12 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden shrink-0 border-2 border-white dark:border-[#2f2f2f]">
                   <img [src]="review.avatar" [alt]="review.name" class="w-full h-full object-cover" />
                </div>
                <div>
                  <div class="font-bold text-zinc-900 dark:text-white">{{ review.name }}</div>
                  <div class="text-xs text-zinc-500 dark:text-zinc-400">{{ review.role }}</div>
                </div>
              </div>
            </div>
          }
        </div>
      </div>
    </section>

    <!-- Footer Area -->
    <footer class="bg-zinc-950 pt-20 pb-10 border-t border-zinc-800">
      <div class="container mx-auto px-6">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-16">
          
          <!-- Brand -->
          <div class="lg:col-span-1">
            <div class="text-2xl font-bold text-white tracking-tight mb-4 flex items-center gap-2">
              <i class="pi pi-compass text-blue-500 text-3xl"></i>
              CarShowroom.
            </div>
            <p class="text-zinc-400 text-sm leading-relaxed mb-6">
              The premium destination for buying and selling exceptional vehicles. We provide an unparalleled automotive experience.
            </p>
            <div class="flex gap-4">
              <a href="#" class="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
                <i class="pi pi-twitter"></i>
              </a>
              <a href="#" class="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
                <i class="pi pi-facebook"></i>
              </a>
              <a href="#" class="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
                <i class="pi pi-instagram"></i>
              </a>
            </div>
          </div>

          <!-- Quick Links -->
          <div>
            <h4 class="text-white font-semibold mb-6 uppercase tracking-wider text-sm">Quick Links</h4>
            <ul class="space-y-4 text-zinc-400 text-sm">
              <li><a routerLink="/used-cars" class="hover:text-blue-400 transition-colors">Used Cars Inventory</a></li>
              <li><a routerLink="/new-cars" class="hover:text-blue-400 transition-colors">New Arrivals</a></li>
              <li><a routerLink="/services" class="hover:text-blue-400 transition-colors">Sell Your Car</a></li>
              <li><a routerLink="/rent" class="hover:text-blue-400 transition-colors">Luxury Rentals</a></li>
            </ul>
          </div>

          <!-- Support -->
          <div>
            <h4 class="text-white font-semibold mb-6 uppercase tracking-wider text-sm">Support</h4>
            <ul class="space-y-4 text-zinc-400 text-sm">
              <li><a href="#" class="hover:text-blue-400 transition-colors">FAQ</a></li>
              <li><a href="#" class="hover:text-blue-400 transition-colors">Contact Us</a></li>
              <li><a href="#" class="hover:text-blue-400 transition-colors">Privacy Policy</a></li>
              <li><a href="#" class="hover:text-blue-400 transition-colors">Terms of Service</a></li>
            </ul>
          </div>

          <!-- Contact -->
          <div>
            <h4 class="text-white font-semibold mb-6 uppercase tracking-wider text-sm">Contact Details</h4>
            <ul class="space-y-4 text-zinc-400 text-sm">
              <li class="flex items-start gap-3">
                <i class="pi pi-map-marker text-blue-500 mt-1"></i>
                <span>123 Luxury Ave, <br/>Beverly Hills, CA 90210</span>
              </li>
              <li class="flex items-center gap-3">
                <i class="pi pi-phone text-blue-500"></i>
                <span>+1 (800) 123-4567</span>
              </li>
              <li class="flex items-center gap-3">
                <i class="pi pi-envelope text-blue-500"></i>
                <span>contact&#64;carshowroom.com</span>
              </li>
            </ul>
          </div>

        </div>

        <div class="border-t border-zinc-900 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-zinc-500">
          <div>&copy; 2026 CarShowroom Codex. All rights reserved.</div>
          <div class="flex gap-6">
            <a href="#" class="hover:text-zinc-300 transition-colors">Privacy</a>
            <a href="#" class="hover:text-zinc-300 transition-colors">Terms</a>
            <a href="#" class="hover:text-zinc-300 transition-colors">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  `
})
export class LandingPage implements OnInit {
  readonly ui = inject(UiSignalStore);
  private readonly catalog = inject(CatalogApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);
  private readonly layout = inject(ResponsiveLayoutService);
  
  readonly heroDensity = computed(() => (this.layout.isDesktop() ? 'full' : this.layout.isTablet() ? 'medium' : 'compact'));
  readonly counters = signal<VehicleInventoryCountersDto | null>(null);
  readonly countersLoading = signal(false);
  readonly countersFailed = signal(false);
  
  readonly price = formatCurrency;
  readonly mileage = formatMileage;
  private counterInterval: ReturnType<typeof setInterval> | null = null;

  readonly testimonials = [
    {
      name: 'Michael R.',
      role: 'Bought a 2024 Porsche 911',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=facearea&facepad=2&w=200&h=200&q=80',
      comment: 'The buying experience was incredible. No pressure, full transparency, and they handled all the paperwork seamlessly. I drove off the lot in under an hour.'
    },
    {
      name: 'Sarah J.',
      role: 'Sold her Mercedes G-Class',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=200&h=200&q=80',
      comment: 'I got an instant quote online that was higher than other dealers. When I brought the car in, they honored the price after a quick 15-minute inspection. Easiest sale ever.'
    },
    {
      name: 'David L.',
      role: 'Bought a 2023 Range Rover',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=facearea&facepad=2&w=200&h=200&q=80',
      comment: 'The team here knows their inventory inside and out. They helped me find the exact spec I was looking for, and their finance department secured an amazing rate.'
    }
  ];

  ngOnInit(): void {
    void this.loadCounters();

    if (isPlatformBrowser(this.platformId)) {
      this.counterInterval = setInterval(() => void this.loadCounters(), 15_000);
      this.destroyRef.onDestroy(() => {
        if (this.counterInterval) {
          clearInterval(this.counterInterval);
        }
      });
    }
  }

  submitSearch(): void {
    void this.router.navigate(['/used-cars'], {
      queryParams: {
        q: this.ui.searchTerm() || null,
      },
    });
  }

  private async loadCounters(): Promise<void> {
    this.countersLoading.set(true);
    this.countersFailed.set(false);

    try {
      const counters = await firstValueFrom(this.catalog.inventoryCounters());
      this.counters.set(counters);
    } catch {
      this.countersFailed.set(true);
    } finally {
      this.countersLoading.set(false);
    }
  }
}
