# Important Queries 
https://blog.scottlogic.com/2020/05/01/rendering-one-million-points-with-d3.html

https://github.com/d3fc/d3fc/tree/master/examples/series-canvas-heatmap/

https://blog.scottlogic.com/2016/03/18/d3fc-love-canvas.html

https://bocoup.com/blog/d3js-and-canvas

https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API

https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D

## Data Description
Data Queries: Queries used for grabbing data on statistics

Raster Queries: Queries used for generating raster images

Points: (Lat, Lon)

SRID: 3857 (That's what leaflet uses)

## OFW Data description

Daily Fishing Effort at 10th Degree Resolution by MMSI, version 2.0, 2012-2020

Fishing effort and vessel presence data is available in the following formats:
 - BigQuery Tables (global-fishing-watch.gfw_public_data.fishing_effort_byvessel_v2)
 - CSVs

Description:
Fishing effort and vessel presence is binned into grid cells 0.1 degrees on a side, and measured in units of hours. The time is calculated by assigning an amount of time to each AIS detection (which is the time to the previous AIS position), and then summing all positions in each grid cell. Data is based on fishing detections of >114,000 unique AIS devices on fishing vessels, of which ~70,000 are active each year. Fishing vessels are identified via a neural network classifier and vessel registry databases. Fishing effort for squid jiggers is not calculated through the neural network, but instead through this heuristic (https://github.com/GlobalFishingWatch/global-footprint-of-fisheries/blob/master/data_production/updated-algorithm-for-squid-jiggers.md).

Vessel information for each MMSI, including flag state, geartype, and vessel dimensions is provided in a separate file (fishing-vessels-v2.csv).

Table Schema:
 - date: Date in YYYY-MM-DD format
 - cell_ll_lat: the latitude of the lower left corner of the grid cell, in decimal degrees
 - cell_ll_lon: the longitude of the lower left corner of the grid cell, in decimal degrees
 - mmsi: Maritime Mobile Service Identity, the identifier for AIS
 - hours: hours that the vessel was present in this gridcell on this day
 - fishing_hours: hours that the vessel was fishing in this grid cell on this day

For additional information about the initial release of this dataset, see the associated journal article: D.A. Kroodsma, J. Mayorga, T. Hochberg, N.A. Miller, K. Boerder, F. Ferretti, A. Wilson, B. Bergman, T.D. White, B.A. Block, P. Woods, B. Sullivan, C. Costello, and B. Worm. "Tracking the global footprint of fisheries." Science 361.6378 (2018). (http://science.sciencemag.org/content/359/6378/904)

Unless otherwise stated, Global Fishing Watch data is licensed under a Creative Commons Attribution-ShareAlike 4.0 International license(https://creativecommons.org/licenses/by-sa/4.0/) and code under an Apache 2.0 license (http://www.apache.org/licenses/LICENSE-2.0).

## Preprocessing 

Add point geometry column 
```
do
$BODY$
begin
	alter table "2020" add column llp geometry;
	UPDATE "2020" SET llp = st_point(cell_ll_lon, cell_ll_lat);
end
$BODY$
```

## Comparing data queries 
minLon = 109
minLat = 21.3
maxLon = 120
maxLat = 25.2

Get sum of fishing hours for date and lat lon using sql math: 

no index on lat lon: 6.949 seconds

composite index (lon, lat): 3.040 seconds
```
select distinct llp, sum(fishing_hours) as tfh
from "2020"
where 
cell_ll_lat between 21.3 and 25.2
and 
cell_ll_lon between 109 and 120
and 
fdate between '2020-01-01' AND '2020-01-31'
group by llp
```

Get sum of fishing hours for date and point intersecting bounding box (indexed on Points): 10.214 seconds
```
select llp, sum(fishing_hours) as tfh
from "2020"
where
llp && st_makeenvelope(109, 21.3, 120, 25.2, 3857) 
and 
fdate between '2020-01-01' AND '2020-01-31'
group by llp
```

Get data 
## Create Raster 
This is shit:
New Plan:
Try using webgl (GPU Acceleration) and D3 to model all the points


Create raster table
```
CREATE TABLE raster_test (
  rid SERIAL primary key, rast raster
);
```


Initialize table with empty raster
```
INSERT INTO test_raster(rid, rast)
VALUES(1, ST_MakeEmptyRaster(
	3600, -- x width
	1800, -- y width
	-180, -- top left corner x coordinate
	90, -- top left corner y coordinate 
	0.1, -- x cell resolution in degrees
	0.1, -- y cell resolution in degrees
	0, -- X skew
	0, -- Y skew
	3857 -- SRID (leaflet EPSG:3857)
));
```


Add an empty band initialized with 0
```
update test_raster
set rast = st_addband(rast, 1, '32BF'::text, 0, NULL)
where rid = 1;
```

