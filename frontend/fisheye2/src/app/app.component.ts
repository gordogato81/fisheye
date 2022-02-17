import { Component, OnInit } from '@angular/core';
import { APIService } from './service/api.service';
import * as L from 'leaflet';
import * as d3 from 'd3';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.sass']
})
export class AppComponent implements OnInit {
  title = 'fisheye';
  constructor(private ds: APIService) {}
  private map!: L.Map;
  private canvas: any;

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
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.map);
    L.canvas().addTo(this.map);
    this.canvas = document.querySelector('canvas')
    const gl = this.canvas.getContext('webgl')
    
    // this.ds.getDateRangeVal().subscribe( data => {
    //   console.log(data)
    // })
    
  }
}
