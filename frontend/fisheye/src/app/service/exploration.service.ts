import { Injectable } from '@angular/core';
import * as L from 'leaflet'

@Injectable({
  providedIn: 'root'
})
export class ExplorationService {

  constructor() { }

  map!: L.Map;
  canvas: any;
  context: any;
  dMax: number = 2439.9774;
  renderer: any;
  data: any;
  interval: number = 0;

  public setMap(map: L.Map) {
    this.map = map;
  }

  public getMap() {
    return this.map;
  }

  public setCanvas(canvas: any) {
    this.canvas = canvas;
  }

  public getCanvas() {
    return this.canvas;
  }

  public setContext(context: any) {
    this.context = context;
  }

  public getContext() {
    return this.context;
  }

  public setDMax(max: number) {
    this.dMax = max;
  }

  public getDMax() {
    return this.dMax;
  }

  public setRenderer(renderer: any) {
    this.renderer = renderer;
  }

  public getRenderer() {
    return this.renderer;
  }

  public setData(data: any) {
    this.data = data;
  }

  public getData() {
    return this.data;
  }

  public setInterval(interval: number) {
    this.interval = interval;
  }

  public getInterval() {
    return this.interval;
  }
}
