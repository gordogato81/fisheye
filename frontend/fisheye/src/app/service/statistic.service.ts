import { Injectable } from '@angular/core';
import * as L from 'leaflet';
@Injectable({
  providedIn: 'root'
})
export class StatisticService {

  constructor() { }

  navMap!: L.Map;
  bl: [number, number] = [0, 0]
  tr: [number, number] = [0, 0]
  public setMap(map: L.Map) {
    this.navMap = map;
  }

  public getMap() {
    return this.navMap;
  }
  
  public setBlTr(bl: [number, number], tr: [number, number]) {
    this.bl = bl;
    this.tr = tr;
  }

  public getBl() {
    return this.bl;
  }

  public getTr() {
    return this.tr;
  }
}
