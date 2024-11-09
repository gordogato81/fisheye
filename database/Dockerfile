FROM postgis/postgis

# ENV POSTGRES_DB="BP_DB"
# ENV POSTGRES_USER="BP_USER"
# ENV POSTGRES_PASSWORD="BP_PASS"

# get raster2pgsql
RUN apt update
RUN apt install -y postgis curl

COPY FishDB.sql /docker-entrypoint-initdb.d/