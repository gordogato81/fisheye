# FishingEye
FishEye is a fishing activity visualization tool designed to identify spatio-temporal patterns in fishing activity. The exploration view allows you to explore spatial trends within a selected timeline. The stastic view allows you to identify temporal trends in fishing activity, making the identification of temporal PoIs easy. The comparison view allows users to compare the fishing activty of an area in up to four different time peroids. 

### Exploration View
![Exploration View](images/Picture1.png)

The exploration view consists of an animated map which can be adapted using the time slider and the filter. The animated map can be adjusted by panning and zooming for a more detailed exploration of a given region. The map displays data for a given time interval that can be adjusted using the date selector found in the filter. The time slider adjusts the starting date of this time interval. This quickly adjusts the temporal position of the visualization, without changing the length of the interval. The data can also be filtered by country by using the country selector. The color scale of the raster data points can also be adjusted between a linear, square root, and logarithmic scaling. The logarithmic scale was chosen to be the default as it was found to provide the most detail, as some locations were found to be fished drastically more than others. It is also possible to display FAO fishing boundaries, to identify in which boundary fishing activity
is taking place. Each raster data point can also be clicked to display a tooltip with additional
information. 

### Statistics View

![Statistics View](images/Picture2.png)
The statistics view is split between two different visualization types, a line and a bar chart. The bar chart, seen in Figure 2, was chosen as it allowed for easily binning the data into user friendly time intervals. The line chart, seen in Figure ??, was chosen as means of comparing different countries fishing efforts. Both charts are adjusted to fit a date range and can be restricted to a defined region (orange box) using the map. Hovering over the charts also provides a tooltip with additional information of the given time step. 

The bar chart can be further adjusted to only show data for a selected country. Additionally, the time interval binning can also be adjusted between days, weeks, months, and years. The line chart can compare the fishing activity of up to four different countries. The line scaling can also be adjusted between a linear, square root and logarithmic scaling. The line chart was chosen as it provided an excellent perspective of the relative fishing effort of each selected country over all time steps within the defined range. The bar chart was chosen as it clearly partitioned the data into temporal bins.
![Statistics View](images/Picture3.png)

### Comparison View
![Comparison View](images/Picture4.png)

The comparison view features a side by side comparison of four geospatial raster visualization. Each visualization can be filtered to fit a different time interval and can be assigned to a specific country. The regions each visualization displays, can be adjusted using the navigation map. The scaling of each visualization can also be adjusted between linear, square root and logarithmic scaling. FAO fishing boundaries can also be toggled for each visualization. Each visualization has its own tooltip so that a comparison of the same raster data point can be made across all four depicted time steps.

## Architecture
The server component contains the database, whilst the client component hosts both the frontend and the backend. The database is using PostgreSQL and is hosted on a database server. The backend is a python flask application that utilizes the psycopg2 extension to connect to the PostgreSQL database. The Flask application accepts requests over HTTP, for which psycopg2 then sends a query to the database. Once the database responds, the application will reformat the data into a JSON object and send it via HTTP to the frontend. The python Flask application is hosted locally using Docker. The frontend uses an Angular/Typescript framework. The backend is called over HTTP whenever new data needs to be retrieved. A JSON file containing MID country code information (used to parse ship MMSI numbers) is stored locally. Additionally, a geoJSON file is requested from the FAO API whenever a component is loaded.

| Technology | Description |
| -----------|-------------|
| Frontend | |
| Angular | Application design framework |
| Typescript | Statically typed, high level programming language |
| HTML5 | Markup language used for creating web pages |
| SASS | Powerful styling language |
| D3 | A JS/TS library for structuring DOM elements for the purpose of creating visualizations |
| RxJS | A JS/TS library for reactive programming using callback functions and Observables |
| Leaflet | A JS/TS library for building web maps |
| Backend | |
| Python | High level programming language with simple syntax |
| Flask | Python based web framework |
| Psycopg2 | PostgreSQL database adapter for python |
| Docker | Containerized application management system |
| Database | |
| PostgreSQL | Open source relational database system |