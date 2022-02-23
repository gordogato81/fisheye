import { Component, OnInit } from '@angular/core';
import { APIService } from './service/api.service';
import * as L from 'leaflet';
import * as d3 from 'd3';
import { tmp } from './interfaces';

// import * as THREE from 'three'
// import { MeshStandardMaterial } from 'three';
declare var renderQueue: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.sass']
})
export class AppComponent implements OnInit {
  title = 'fisheye';
  constructor(private ds: APIService) { }
  private map!: L.Map;
  private canvas: any;
  private raster: any;
  private r_data: any;
  private dMax: any;
  private render: any;

  ngOnInit(): void {

    const that = this;
    this.map = L.map('map').setView([18, 0], 2.5); // defaults to world view 
    const tilelayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      minZoom: 2,
      maxZoom: 10,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    });

    tilelayer.addTo(this.map);
    L.canvas().addTo(this.map);
    this.canvas = d3.select(this.map.getPanes().overlayPane).select('canvas');
    let context = this.canvas.node().getContext('2d');

    this.ds.getDateRangeVal("2020-01-01", "2020-01-31").subscribe(data => {
      this.r_data = data;
      console.log(this.r_data);
      this.render = new renderQueue(draw).clear(clearContext);
      this.dMax = d3.max(data, (d: any) => +d.tfh) ?? 0;
      this.render(this.r_data);
    });
    that.map.on('moveend zoomend', update);
    function update() {
      that.render(that.r_data);
    }
    function draw(d: tmp) {
      let colorMap = d3.scaleSymlog<string, number>()
      colorMap.domain([0, that.dMax]).range(["white", "purple"])
      const newX = that.map.latLngToLayerPoint(L.latLng(d.lat, d.lon)).x;
      const newY = that.map.latLngToLayerPoint(L.latLng(d.lat, d.lon)).y + 0.1;
      context.fill();
      context.beginPath();
      context.fillStyle = colorMap(d.tfh);
      context.rect(newX, newY, detSize(d)[0], detSize(d)[1]);
      context.fill();
      context.closePath();
    }
    function clearContext() {
      context.clearRect(0, 0, that.canvas.attr("width"), that.canvas.attr("height"));
    }
    function detSize(d: any) {
      const lat: number = parseFloat(d.lat);
      const lon: number = parseFloat(d.lon);
      const first = L.latLng(lat, lon);
      const second = L.latLng(lat + 0.1, lon + 0.1);
      let diffX = Math.abs(that.map.latLngToContainerPoint(first).x - that.map.latLngToContainerPoint(second).x)
      let diffY = Math.abs(that.map.latLngToContainerPoint(first).y - that.map.latLngToContainerPoint(second).y)
      diffX = diffX < 1 ? 1 : diffX;
      diffY = diffY < 1 ? 1 : diffY;
      const size: [number, number] = [diffX, diffY];
      return size

    }
  }

}
