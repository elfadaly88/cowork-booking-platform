import { Component, Input, Output, EventEmitter, AfterViewInit, OnDestroy, ElementRef, ViewChild, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';

@Component({
  selector: 'app-map-location-picker',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="map-container">
      <div #mapElement class="map-frame"></div>
      <div class="map-overlay" *ngIf="!initialLocationSet">
        Click on the map to select workspace location
      </div>
    </div>
  `,
  styles: [`
    .map-container { position: relative; width: 100%; height: 350px; border-radius: 8px; overflow: hidden; border: 1px solid #ccc; margin-bottom: 15px; }
    .map-frame { width: 100%; height: 100%; z-index: 1; }
    .map-overlay { position: absolute; top: 15px; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.7); color: white; padding: 6px 16px; border-radius: 20px; z-index: 1000; pointer-events: none; font-size: 0.9em; font-weight: 500;}
  `]
})
export class MapLocationPickerComponent implements AfterViewInit, OnDestroy, OnChanges {
  @ViewChild('mapElement') mapElement!: ElementRef;
  @Input() initialLatitude: number | null = null;
  @Input() initialLongitude: number | null = null;
  @Output() locationSelected = new EventEmitter<{lat: number, lng: number}>();

  private map: L.Map | null = null;
  private marker: L.Marker | null = null;
  initialLocationSet = false;

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

  private updateMarker(lat: number, lng: number): void {
    if (this.marker) {
      this.marker.setLatLng([lat, lng]);
    } else if (this.map) {
      this.marker = L.marker([lat, lng]).addTo(this.map);
    }
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

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.initialLocationSet = true;
      const { lat, lng } = e.latlng;
      this.updateMarker(lat, lng);
      this.locationSelected.emit({ lat, lng });
    });
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }
}
