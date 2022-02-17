import { Component, OnInit } from '@angular/core';
import { APIService } from './service/api.service';
import * as L from 'leaflet';
import * as d3 from 'd3';
import * as fc from 'd3fc';

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
  ngOnInit(): void {
    // Beginnings of a custom WebGL application
    // const canvas = <HTMLCanvasElement> document.querySelector("#glCanvas");
    // // Initialize the GL context
    // const gl = canvas.getContext("webgl");

    // // Only continue if WebGL is available and working
    // if (gl === null) {
    //   alert("Unable to initialize WebGL. Your browser or machine may not support it.");
    //   return;
    // }

    // // Set clear color to black, fully opaque
    // gl.clearColor(0.0, 0.0, 0.0, 1.0);
    // // Clear the color buffer with specified clear color
    // gl.clear(gl.COLOR_BUFFER_BIT);

    this.map = L.map('map').setView([18, 0], 2.5); // defaults to world view 
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      minZoom: 2,
      maxZoom: 10,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.map);
    L.canvas().addTo(this.map);
    // this.canvas = document.querySelector('canvas')
    // const gl = this.canvas.getContext('webgl')
    this.canvas = d3.select(this.map.getPanes().overlayPane).select('canvas');
    let context = this.canvas.node().getContext('2d');
    let detachedContainer = document.createElement("custom");
    let dataContainer = d3.select(detachedContainer);

    const that = this;

    this.ds.getDateRangeVal().subscribe(data => {
      this.r_data = data;
      databind(this.r_data)
    })
    that.map.on('moveend zoomend', update);
    function init() {
      const r_g = that.canvas.append('g').attr("class", "leaflet-zoom-hide");

      that.raster = r_g.selectAll('myCircles')
        .data(that.r_data)
        .enter()
        .append('circle')
        .attr('cx', (d: any) => that.map.latLngToLayerPoint(L.latLng(d.lat, d.lon)).x)
        .attr('cy', (d: any) => that.map.latLngToLayerPoint(L.latLng(d.lat, d.lon)).y)
        .attr('r', 2)
        .attr('stroke', 'black')
        .attr('fill', 'none');
    }
    function update() {
      // that.raster
      //   .attr('cx', (d: any) => that.map.latLngToLayerPoint(L.latLng(d.lat, d.lon)).x)
      //   .attr('cy', (d: any) => that.map.latLngToLayerPoint(L.latLng(d.lat, d.lon)).y)
      draw();
    }
    function databind(data: any) {
      const size = 5;
      let colorMap = d3.scaleSymlog<string, number>()
      let dMax = d3.max(data, (d: any) => +d.tfh) ?? 0;
      colorMap.domain([0, dMax]).range(["white", "purple"])
      that.raster = dataContainer.selectAll("custom.rect")
        .data(data, function (d: any) { return d.tfh; });

      that.raster
        .attr("size", size)
        .attr("fillStyle", "#fff");

      that.raster.enter()
        .append("custom")
        .classed("rect", true)
        .attr("x", (d: any) => that.map.latLngToLayerPoint(L.latLng(d.lat, d.lon)).x)
        .attr("y", (d: any) => that.map.latLngToLayerPoint(L.latLng(d.lat, d.lon)).y + 0.1)
        .attr("size", size)
        .attr("fillStyle", (d: any) => colorMap(d.tfh));

      that.raster.exit()
        .attr("size", size)
        .attr("fillStyle", "#fff");

      draw()
    }
    function draw() {
      // clear canvas
      context.clearRect(0, 0, that.canvas.attr("width"), that.canvas.attr("height"));
      context.fill();

      var elements = dataContainer.selectAll("custom.rect");
  
      elements.each(function (d: any) {
        var node = d3.select(this);
        const newX = that.map.latLngToLayerPoint(L.latLng(d.lat, d.lon)).x;
        const newY = that.map.latLngToLayerPoint(L.latLng(d.lat, d.lon)).y + 0.1;
        const sizeScale = d3.scalePow().exponent(1.5).domain([2, 10]).range([2, 74])
        const size: any = node.attr("size") ?? 5;
        // const newSize = (size * 2 * that.map.getZoom()) / that.map.getMaxZoom()
        context.beginPath();
        context.fillStyle = node.attr("fillStyle");
        context.rect(newX, newY, size, size); // sizeScale(that.map.getZoom()) // https://stackoverflow.com/questions/46917945/d3-how-to-keep-element-same-size-while-transform-scale-translate
        context.fill();
        context.closePath();

      });
    }
  }
}
