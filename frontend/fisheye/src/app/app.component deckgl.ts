import { Component, OnInit } from '@angular/core';
import { APIService } from './service/api.service';
import { Deck, MapView } from '@deck.gl/core';
import { ScreenGridLayer } from '@deck.gl/aggregation-layers';
import { ScatterplotLayer } from '@deck.gl/layers';
import { DeckGlLeaflet, LeafletLayer } from 'deck.gl-leaflet';
import * as L from 'leaflet'
import { dtmp } from './interfaces';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.sass']
})
export class AppComponent implements OnInit {
  title = 'fisheye';
  constructor(private ds: APIService) { }
  private map: any;
  ngOnInit(): void {
    const that = this;

    this.map = L.map('map').setView([18, 0], 2.5); // defaults to world view 
    const tilelayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      minZoom: 2,
      maxZoom: 10,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    });
    tilelayer.addTo(this.map)
    this.ds.getDV().subscribe(data => {
      console.log(data);
      init(data);
      const featureGroup = L.featureGroup();
    });
    function init(rData: dtmp[]) {
      const deckLayer = new LeafletLayer({
        views: [
          new MapView({
            repeat: true
          })
        ],
        layers: [
          new ScatterplotLayer({
            data: rData,
            getPosition: (d: dtmp) => d.coords,
            getRadius: 10,
            getFillColor: [255, 0, 0],
            pickable: true,
          }),
        ]
      });
      that.map.addLayer(deckLayer);
    }
  }
}
// new ScreenGridLayer({
//   id: 'screen-grid-layer',
//   data,
//   pickable: false,
//   cellSizePixels: 10,
//   colorRange: [
//     [255, 184, 0, 25],
//     [255, 184, 0, 85],
//     [255, 184, 0, 127],
//     [255, 184, 0, 170],
//     [255, 184, 0, 190],
//     [255, 184, 0, 255]
//   ],
//   getPosition: (d: any) => d.coords,
//   getWeight: (d: any) => d.tfh
// })