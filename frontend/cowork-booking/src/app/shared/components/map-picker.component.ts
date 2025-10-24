import { Component, OnInit, OnDestroy, AfterViewInit, EventEmitter, Output, Input, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import * as L from 'leaflet';

interface SearchResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

@Component({
  selector: 'app-map-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="map-picker-container">
      <div class="map-header">
        <h3>📍 Select Location on Map</h3>
        <p class="map-instruction">Search for a place or click on the map to set the location</p>
      </div>

      <!-- Search Box -->
      <div class="search-container">
        <div class="search-box">
          <input
            type="text"
            [(ngModel)]="searchQuery"
            (keyup.enter)="searchLocation()"
            placeholder="Search for a place, address, or city..."
            class="search-input"
          />
          <button
            type="button"
            (click)="searchLocation()"
            [disabled]="isSearching()"
            class="search-button"
          >
            {{ isSearching() ? '🔍 Searching...' : '🔍 Search' }}
          </button>
        </div>

        @if (searchResults().length > 0) {
          <div class="search-results">
            @for (result of searchResults(); track result.place_id) {
              <div class="search-result-item" (click)="selectSearchResult(result)">
                <span class="result-icon">📍</span>
                <span class="result-text">{{ result.display_name }}</span>
              </div>
            }
          </div>
        }

        @if (searchError()) {
          <div class="search-error">
            {{ searchError() }}
          </div>
        }
      </div>

      <div id="map" class="map"></div>

      <div class="coordinates-display" *ngIf="selectedCoordinates()">
        <div class="coord-item">
          <span class="coord-label">Latitude:</span>
          <span class="coord-value">{{ selectedCoordinates()!.lat.toFixed(6) }}</span>
        </div>
        <div class="coord-item">
          <span class="coord-label">Longitude:</span>
          <span class="coord-value">{{ selectedCoordinates()!.lng.toFixed(6) }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .map-picker-container {
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      margin-bottom: 1.5rem;
    }

    .map-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 1rem 1.5rem;
    }

    .map-header h3 {
      margin: 0 0 0.5rem 0;
      font-size: 1.25rem;
      font-weight: 600;
    }

    .map-instruction {
      margin: 0;
      font-size: 0.9rem;
      opacity: 0.9;
    }

    .search-container {
      padding: 1rem 1.5rem;
      background: #f9fafb;
      border-bottom: 1px solid #e5e7eb;
    }

    .search-box {
      display: flex;
      gap: 0.75rem;
    }

    .search-input {
      flex: 1;
      padding: 0.75rem 1rem;
      border: 2px solid #d1d5db;
      border-radius: 8px;
      font-size: 1rem;
      transition: all 0.2s;

      &:focus {
        outline: none;
        border-color: #667eea;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
      }
    }

    .search-button {
      padding: 0.75rem 1.5rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;

      &:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }

    .search-results {
      margin-top: 0.75rem;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      max-height: 300px;
      overflow-y: auto;
    }

    .search-result-item {
      padding: 0.75rem 1rem;
      border-bottom: 1px solid #e5e7eb;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      transition: background 0.2s;

      &:last-child {
        border-bottom: none;
      }

      &:hover {
        background: #f3f4f6;
      }
    }

    .result-icon {
      font-size: 1.2rem;
      flex-shrink: 0;
    }

    .result-text {
      flex: 1;
      font-size: 0.9rem;
      color: #374151;
      line-height: 1.4;
    }

    .search-error {
      margin-top: 0.75rem;
      padding: 0.75rem;
      background: #fee2e2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      color: #991b1b;
      font-size: 0.9rem;
    }

    .map {
      width: 100%;
      height: 400px;
      z-index: 1;
    }

    /* Custom marker styling */
    :host ::ng-deep .custom-map-marker {
      background: transparent;
      border: none;
      cursor: pointer;
    }

    :host ::ng-deep .custom-map-marker svg {
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
      transition: transform 0.2s;
    }

    :host ::ng-deep .custom-map-marker:hover svg {
      transform: scale(1.1);
    }

    .coordinates-display {
      background: #f9fafb;
      padding: 1rem 1.5rem;
      display: flex;
      gap: 2rem;
      border-top: 1px solid #e5e7eb;
    }

    .coord-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .coord-label {
      font-weight: 600;
      color: #6b7280;
      font-size: 0.9rem;
    }

    .coord-value {
      font-family: 'Courier New', monospace;
      background: white;
      padding: 0.25rem 0.75rem;
      border-radius: 6px;
      border: 1px solid #d1d5db;
      color: #1f2937;
      font-size: 0.9rem;
    }

    @media (max-width: 640px) {
      .map {
        height: 300px;
      }

      .search-box {
        flex-direction: column;
      }

      .search-button {
        width: 100%;
      }

      .coordinates-display {
        flex-direction: column;
        gap: 0.75rem;
      }
    }
  `]
})
export class MapPickerComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() initialLat?: number;
  @Input() initialLng?: number;
  @Output() locationSelected = new EventEmitter<{ lat: number; lng: number }>();

  private map!: L.Map;
  private marker?: L.Marker;
  private http = inject(HttpClient);

  selectedCoordinates = signal<{ lat: number; lng: number } | null>(null);
  searchQuery = '';
  searchResults = signal<SearchResult[]>([]);
  isSearching = signal(false);
  searchError = signal<string | null>(null);

  ngOnInit(): void {
    // Create custom marker icon using inline SVG
    const customIcon = L.divIcon({
      className: 'custom-map-marker',
      html: `
        <svg width="32" height="48" viewBox="0 0 32 48" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 0C7.163 0 0 7.163 0 16c0 13 16 32 16 32s16-19 16-32c0-8.837-7.163-16-16-16z"
                fill="#667eea" stroke="#fff" stroke-width="2"/>
          <circle cx="16" cy="16" r="6" fill="#fff"/>
        </svg>
      `,
      iconSize: [32, 48],
      iconAnchor: [16, 48],
      popupAnchor: [0, -48]
    });

    // Set as default icon
    L.Marker.prototype.options.icon = customIcon;
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }

  private initMap(): void {
    // Default center (Cairo, Egypt) or use provided coordinates
    const centerLat = this.initialLat || 30.0444;
    const centerLng = this.initialLng || 31.2357;

    // Define bounds for Cairo and Giza governorates
    const southWest = L.latLng(29.8, 30.9); // Southwest corner of the area
    const northEast = L.latLng(30.3, 31.5); // Northeast corner of the area
    const bounds = L.latLngBounds(southWest, northEast);

    this.map = L.map('map', {
      maxBounds: bounds,
      maxBoundsViscosity: 1.0, // Prevent dragging outside bounds
      minZoom: 10, // Prevent zooming out too far
      maxZoom: 19
    }).setView([centerLat, centerLng], this.initialLat ? 15 : 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(this.map);

    // Add initial marker if coordinates provided
    if (this.initialLat && this.initialLng) {
      this.addMarker(this.initialLat, this.initialLng);
    }

    // Click event to add/move marker
    this.map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      this.addMarker(lat, lng);
    });
  }

  private addMarker(lat: number, lng: number): void {
    // Remove existing marker if any
    if (this.marker) {
      this.map.removeLayer(this.marker);
    }

    // Add new marker
    this.marker = L.marker([lat, lng], {
      draggable: true
    }).addTo(this.map);

    // Update coordinates
    this.updateCoordinates(lat, lng);

    // Handle marker drag
    this.marker.on('dragend', () => {
      const position = this.marker!.getLatLng();
      this.updateCoordinates(position.lat, position.lng);
    });

    // Add popup
    this.marker.bindPopup(`<b>Selected Location</b><br>Lat: ${lat.toFixed(6)}<br>Lng: ${lng.toFixed(6)}`).openPopup();
  }

  private updateCoordinates(lat: number, lng: number): void {
    const coordinates = { lat, lng };
    this.selectedCoordinates.set(coordinates);
    this.locationSelected.emit(coordinates);
  }

  searchLocation(): void {
    if (!this.searchQuery.trim()) {
      return;
    }

    this.isSearching.set(true);
    this.searchError.set(null);
    this.searchResults.set([]);

    // Use Nominatim API for geocoding - restricted to Cairo and Giza, Egypt
    const searchTerm = `${this.searchQuery}, Cairo, Egypt`;
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchTerm)}&limit=5&countrycodes=eg&bounded=1&viewbox=30.9,29.8,31.5,30.3`;

    this.http.get<SearchResult[]>(url).subscribe({
      next: (results) => {
        this.isSearching.set(false);
        // Filter results to only show locations within Cairo and Giza bounds
        const filteredResults = results.filter(result => {
          const lat = parseFloat(result.lat);
          const lng = parseFloat(result.lon);
          return lat >= 29.8 && lat <= 30.3 && lng >= 30.9 && lng <= 31.5;
        });

        if (filteredResults.length === 0) {
          this.searchError.set('No results found in Cairo/Giza area. Try a different search term.');
        } else {
          this.searchResults.set(filteredResults);
        }
      },
      error: () => {
        this.isSearching.set(false);
        this.searchError.set('Search failed. Please try again.');
      }
    });
  }

  selectSearchResult(result: SearchResult): void {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);

    // Move map to selected location
    this.map.setView([lat, lng], 15);

    // Add marker at the location
    this.addMarker(lat, lng);

    // Clear search results
    this.searchResults.set([]);
    this.searchQuery = '';
  }
}
