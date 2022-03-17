import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ComparisonService {

  constructor() { }

  navigation!: L.Map;
  center: any;
  zoom: any;
  bl: [number, number] = [0, 0]
  tr: [number, number] = [0, 0]
  map1!: L.Map;
  map2!: L.Map;
  map3!: L.Map;
  map4!: L.Map;
  canvas1: any;
  canvas2: any;
  canvas3: any;
  canvas4: any;
  context1: any;
  context2: any;
  context3: any;
  context4: any;
  data1: any;
  data2: any;
  data3: any;
  data4: any;
  renderer1: any;
  renderer2: any;
  renderer3: any;
  renderer4: any;
  max1: any;
  max2: any;
  max3: any;
  max4: any;
  init1: boolean = false;
  init2: boolean = false;
  init3: boolean = false;
  init4: boolean = false;


  public setCenter(center: any) {
    this.center = center;
  }

  public getCenter() {
    return this.center;
  }

  public setZoom(zoom: any) {
    this.zoom = zoom;
  }

  public getZoom() {
    return this.zoom;
  }

  public setMap(map: L.Map, id: number) {
    if (id == 0) {
      this.navigation = map;
    } else if (id == 1) {
      this.map1 = map;
    } else if (id == 2) {
      this.map2 = map;
    } else if (id == 3) {
      this.map3 = map;
    } else if (id == 4) {
      this.map4 = map;
    }
  }

  public getMap(id: number) {
    if (id == 0) {
      return this.navigation;
    } else if (id == 1) {
      return this.map1;
    } else if (id == 2) {
      return this.map2;
    } else if (id == 3) {
      return this.map3;
    } else if (id == 4) {
      return this.map4;
    }
    return undefined;
  }

  public setCanvas(canvas: any, id: number) {
    if (id == 1) {
      this.canvas1 = canvas;
    } else if (id == 2) {
      this.canvas2 = canvas;
    } else if (id == 3) {
      this.canvas3 = canvas;
    } else if (id == 4) {
      this.canvas4 = canvas;
    }
  }

  public getCanvas(id: number) {
    if (id == 1) {
      return this.canvas1;
    } else if (id == 2) {
      return this.canvas2;
    } else if (id == 3) {
      return this.canvas3;
    } else if (id == 4) {
      return this.canvas4;
    }
    return undefined;
  }

  public setContext(context: any, id: number) {
    if (id == 1) {
      this.context1 = context;
    } else if (id == 2) {
      this.context2 = context;
    } else if (id == 3) {
      this.context3 = context;
    } else if (id == 4) {
      this.context4 = context;
    }
  }

  public getContext(id: number) {
    if (id == 1) {
      return this.context1;
    } else if (id == 2) {
      return this.context2;
    } else if (id == 3) {
      return this.context3;
    } else if (id == 4) {
      return this.context4;
    }
    return undefined;
  }

  public setData(data: any, id: number) {
    if (id == 1) {
      this.data1 = data;
    } else if (id == 2) {
      this.data2 = data;
    } else if (id == 3) {
      this.data3 = data;
    } else if (id == 4) {
      this.data4 = data;
    }
  }

  public getData(id: number) {
    if (id == 1) {
      return this.data1;
    } else if (id == 2) {
      return this.data2;
    } else if (id == 3) {
      return this.data3;
    } else if (id == 4) {
      return this.data4;
    }
    return undefined;
  }

  public setLoaded(id: number) {
    if (id == 1) {
      this.init1 = true;
    } else if (id == 2) {
      this.init2 = true;
    } else if (id == 3) {
      this.init3 = true;
    } else if (id == 4) {
      this.init4 = true;
    }
  }

  public getLoaded(id: number) {
    if (id == 1) {
      return this.init1;
    } else if (id == 2) {
      return this.init2;
    } else if (id == 3) {
      return this.init3;
    } else if (id == 4) {
      return this.init4;
    }
    return undefined;
  }

  public setRenderer(renderer: any, id: number) {
    if (id == 1) {
      this.renderer1 = renderer;
    } else if (id == 2) {
      this.renderer2 = renderer;
    } else if (id == 3) {
      this.renderer3 = renderer;
    } else if (id == 4) {
      this.renderer4 = renderer;
    }
  }

  public getRenderer(id: number) {
    if (id == 1) {
      return this.renderer1;
    } else if (id == 2) {
      return this.renderer2;
    } else if (id == 3) {
      return this.renderer3;
    } else if (id == 4) {
      return this.renderer4;
    }
    return undefined;
  }

  public setMax(max: any, id: number) {
    if (id == 1) {
      this.max1 = max;
    } else if (id == 2) {
      this.max2 = max;
    } else if (id == 3) {
      this.max3 = max;
    } else if (id == 4) {
      this.max4 = max;
    }
  }

  public getMax(id: number) {
    if (id == 1) {
      return this.max1;
    } else if (id == 2) {
      return this.max2;
    } else if (id == 3) {
      return this.max3;
    } else if (id == 4) {
      return this.max4;
    }
    return undefined;
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
