// define the pub interface
export interface fTemp {
    name: string;
    geom: {
        type: string;
        coordinates: [long: number, lat: number];
    };
}

//Amenity interface
export interface fSpat {
    name: string;
    geom: {
        type: string;
        coordinates: [lon: number, lat: number];
    };
}

export interface tmp {
    lat: number,
    lon: number,
    tfh: number
}

export interface cData {
    date: Date,
    tfh: number
}

export interface dtmp {
    coords: [number, number],
    tfh: number
}

export interface Country {
    viewValue: string,
}

export interface Mid {
    viewValue: string,
    mid: string;
}

export interface bin {
    x0: Date,
    x1: Date
}