import { Component, Input, Output, EventEmitter, AfterViewInit, OnDestroy, ElementRef, ViewChild, OnChanges, SimpleChanges, NgZone, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';

@Component({
  selector: 'app-map-location-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="map-picker-wrapper">
      <div class="map-search-bar">
        <input
          type="text"
          class="search-input"
          [(ngModel)]="searchQuery"
          (keyup.enter)="searchLocation()"
          placeholder="Search by address or place name"
        />
        <button type="button" class="btn-search" (click)="searchLocation()" [disabled]="searching || !searchQuery.trim()">
          <span *ngIf="!searching">Search</span>
          <span *ngIf="searching">Searching...</span>
        </button>
      </div>
      <div class="search-error" *ngIf="searchError">⚠️ {{ searchError }}</div>
      <div class="search-results" *ngIf="searchResults.length > 0">
        <button
          type="button"
          class="search-result-item"
          *ngFor="let result of searchResults"
          (click)="selectSearchResult(result)">
          {{ result.display_name }}
        </button>
      </div>
      <div class="map-actions-bar">
        <button type="button" class="btn-use-location" (click)="useCurrentLocation()" [disabled]="geolocating">
          <span *ngIf="!geolocating">📍 Use My Current Location</span>
          <span *ngIf="geolocating">⏳ Detecting location...</span>
        </button>
      </div>
      <div class="map-container">
        <div #mapElement class="map-frame"></div>
        <div class="map-overlay" *ngIf="!initialLocationSet">
          📍 Click on the map or use the button above to set the workspace location
        </div>
      </div>
      <div class="geo-error" *ngIf="geoError">⚠️ {{ geoError }}</div>
      <div class="map-coordinates" *ngIf="selectedLat !== null && selectedLng !== null">
        ✅ Selected: {{ selectedLat | number:'1.6-6' }}, {{ selectedLng | number:'1.6-6' }}
      </div>
    </div>
  `,
  styles: [`
    .map-picker-wrapper { width: 100%; }
    .map-search-bar { display: flex; gap: 8px; margin-bottom: 8px; }
    .search-input { flex: 1; min-width: 0; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.9rem; }
    .search-input:focus { outline: none; border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12); }
    .btn-search { padding: 8px 14px; background: #0f766e; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 0.875rem; font-weight: 500; }
    .btn-search:hover:not(:disabled) { background: #0d675f; }
    .btn-search:disabled { opacity: 0.6; cursor: not-allowed; }
    .search-error { color: #dc2626; font-size: 0.85rem; margin-bottom: 6px; }
    .search-results { display: grid; gap: 6px; margin-bottom: 8px; max-height: 180px; overflow: auto; }
    .search-result-item { text-align: left; border: 1px solid #e2e8f0; background: #fff; border-radius: 6px; padding: 8px 10px; font-size: 0.85rem; cursor: pointer; }
    .search-result-item:hover { border-color: #93c5fd; background: #f8fbff; }
    .map-actions-bar { margin-bottom: 8px; }
    .btn-use-location { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; background: #2563eb; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 0.875rem; font-weight: 500; transition: background 0.2s; }
    .btn-use-location:hover:not(:disabled) { background: #1d4ed8; }
    .btn-use-location:disabled { opacity: 0.6; cursor: not-allowed; }
    .map-container { position: relative; width: 100%; height: 350px; border-radius: 8px; overflow: hidden; border: 1px solid #ccc; margin-bottom: 8px; }
    .map-frame { width: 100%; height: 100%; z-index: 1; }
    .map-overlay { position: absolute; top: 15px; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.7); color: white; padding: 6px 16px; border-radius: 20px; z-index: 1000; pointer-events: none; font-size: 0.9em; font-weight: 500; white-space: nowrap; }
    .geo-error { color: #dc2626; font-size: 0.85rem; margin-top: 4px; }
    .map-coordinates { color: #16a34a; font-size: 0.85rem; margin-top: 4px; font-weight: 500; }
  `]
})
export class MapLocationPickerComponent implements AfterViewInit, OnDestroy, OnChanges {
  @ViewChild('mapElement') mapElement!: ElementRef;
  @Input() initialLatitude: number | null = null;
  @Input() initialLongitude: number | null = null;
  @Output() locationSelected = new EventEmitter<{lat: number, lng: number}>();

  private zone = inject(NgZone);
  private map: L.Map | null = null;
  private marker: L.Marker | null = null;
  initialLocationSet = false;
  geolocating = false;
  geoError: string | null = null;
  selectedLat: number | null = null;
  selectedLng: number | null = null;
  searching = false;
  searchQuery = '';
  searchError: string | null = null;
  searchResults: Array<{ display_name: string; lat: string; lon: string }> = [];

  ngAfterViewInit(): void {
    this.initMap();
    setTimeout(() => {
        if (this.map) this.map.invalidateSize();
    }, 250);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['initialLatitude'] || changes['initialLongitude']) && this.map) {
      if (this.initialLatitude && this.initialLongitude && !this.initialLocationSet) {
        this.updateMarker(this.initialLatitude, this.initialLongitude);
        this.map.setView([this.initialLatitude, this.initialLongitude], 15);
      }
    }
  }

  /** Places / moves the marker and updates coordinate display. */
  private updateMarker(lat: number, lng: number): void {
    this.selectedLat = lat;
    this.selectedLng = lng;
    const popupText = `📍 ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    if (this.marker) {
      this.marker.setLatLng([lat, lng]);
      this.marker.setPopupContent(popupText).openPopup();
    } else if (this.map) {
      this.marker = L.marker([lat, lng])
        .bindPopup(popupText)
        .addTo(this.map)
        .openPopup();
    }
  }

  /** Uses the browser Geolocation API to detect the user's current position. */
  useCurrentLocation(): void {
    if (!navigator.geolocation) {
      this.geoError = 'Geolocation is not supported by your browser.';
      return;
    }
    this.geolocating = true;
    this.geoError = null;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        // Geolocation callback also runs outside NgZone.
        this.zone.run(() => {
          this.geolocating = false;
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          this.initialLocationSet = true;
          this.updateMarker(lat, lng);
          this.map?.setView([lat, lng], 16);
          this.locationSelected.emit({ lat, lng });
        });
      },
      (error) => {
        this.zone.run(() => {
          this.geolocating = false;
          if (error.code === error.PERMISSION_DENIED) {
            this.geoError = 'Location access denied. Please allow location access or click on the map.';
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            this.geoError = 'Location unavailable. Please click on the map to set the position.';
          } else {
            this.geoError = 'Could not detect location. Please click on the map.';
          }
        });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  /** Searches locations with OpenStreetMap Nominatim and displays quick-pick results. */
  async searchLocation(): Promise<void> {
    const query = this.searchQuery.trim();
    if (!query) {
      this.searchResults = [];
      this.searchError = 'Please type a place or address to search.';
      return;
    }

    this.searching = true;
    this.searchError = null;
    this.searchResults = [];

    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=6&q=${encodeURIComponent(query)}`;
      const response = await fetch(url, {
        headers: {
          Accept: 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Location search failed.');
      }

      const results = await response.json();
      if (!Array.isArray(results) || results.length === 0) {
        this.searchError = 'No locations found. Try another search.';
        return;
      }

      this.searchResults = results;
    } catch {
      this.searchError = 'Unable to search locations right now. Please try again.';
    } finally {
      this.searching = false;
    }
  }

  selectSearchResult(result: { display_name: string; lat: string; lon: string }): void {
    const lat = Number(result.lat);
    const lng = Number(result.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      this.searchError = 'Invalid location result.';
      return;
    }

    this.initialLocationSet = true;
    this.geoError = null;
    this.searchError = null;
    this.searchResults = [];

    this.updateMarker(lat, lng);
    this.map?.setView([lat, lng], 16);
    this.locationSelected.emit({ lat, lng });
  }

  private initMap(): void {
    const iconDefault = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
    L.Marker.prototype.options.icon = iconDefault;

    const defaultLat = 30.0444; // Centered to Cairo as a default fallback
    const defaultLng = 31.2357;
    const lat = this.initialLatitude ?? defaultLat;
    const lng = this.initialLongitude ?? defaultLng;

    this.map = L.map(this.mapElement.nativeElement).setView([lat, lng], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    if (this.initialLatitude && this.initialLongitude) {
      this.initialLocationSet = true;
      this.updateMarker(this.initialLatitude, this.initialLongitude);
    }

    // Leaflet fires events outside Angular's NgZone.
    // zone.run() ensures patchValue() in the parent triggers change detection
    // so workspaceForm.invalid is re-evaluated and the submit button un-disables.
    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.zone.run(() => {
        this.initialLocationSet = true;
        this.geoError = null;
        const { lat, lng } = e.latlng;
        this.updateMarker(lat, lng);
        this.locationSelected.emit({ lat, lng });
      });
    });
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }
}
