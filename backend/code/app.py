from flask import Flask, jsonify, request
from flask_cors import cross_origin, CORS 
from psycopg2 import connect
from psycopg2.sql import SQL, Literal
from psycopg2.extras import RealDictCursor
from os import environ

app = Flask(__name__)
cors_origins = ['http://localhost', 'http://localhost:80',
                'http://localhost:4200', 'http://localhost:5001']
cors = CORS(app)
app.config['CORS_HEADERS'] = 'Content-Type'

HOST = environ['DB_HOST']
DB = environ['POSTGRES_DB']
DB_USER = environ['POSTGRES_USER']
DB_PASS = environ['POSTGRES_PASSWORD']
PORT = environ['DB_PORT']


@app.route('/getQuadValues', methods=["GET", "POST"])
@cross_origin(origins=cors_origins)
def getQuadValues():
    """
    Request method for getting data for the exploration view.
    """
    connection = connect(host=HOST, port=PORT, dbname=DB, user=DB_USER, password=DB_PASS)

    b1 = [0, 1]
    b2 = [0, 2]
    b3 = [0, 3]
    start = request.args.get("start", "2020-01-01", type=str)
    end = request.args.get("end", "2020-01-05", type=str)
    batchNum = request.args.get("batch", 0, type=int)
    b1[0] = request.args.get("b1[0]", 0, type=int)
    b1[1] = request.args.get("b1[1]", 0, type=int)
    b2[0] = request.args.get("b2[0]", 0, type=int)
    b2[1] = request.args.get("b2[1]", 0, type=int)
    b3[0] = request.args.get("b3[0]", 0, type=int)
    b3[1] = request.args.get("b3[1]", 0, type=int)
    
    query = """
    select cell_ll_lat as lat, cell_ll_lon as lon, sum(fishing_hours) as tfh
    from "FishingHours"
    where
    date between {start_date}::date AND {end_date}::date
    """

    if (batchNum == 0):
        query += """
        group by cell_ll_lat, cell_ll_lon
        """
        query = SQL(query).format(
            start_date=Literal(start),
            end_date=Literal(end)
        )
    elif (batchNum == 1):
        query += """
        AND
        mmsi between {b10} AND {b11}  
        group by cell_ll_lat, cell_ll_lon
        """
        query = SQL(query).format(
            start_date=Literal(start),
            end_date=Literal(end),
            b10=Literal(b1[0]),
            b11=Literal(b1[1])
        )
    elif (batchNum == 2):
        query += """
        AND
        (mmsi between {b10} AND {b11} OR mmsi between {b20} AND {b21}) 
        group by cell_ll_lat, cell_ll_lon
        """
        query = SQL(query).format(
            start_date=Literal(start),
            end_date=Literal(end),
            b10=Literal(b1[0]),
            b11=Literal(b1[1]),
            b20=Literal(b2[0]),
            b21=Literal(b2[1])
        )
    elif (batchNum == 3):
        query += """
        AND
        (mmsi between {b10} AND {b11} OR mmsi between {b20} AND {b21} OR mmsi between {b30} AND {b31}) 
        group by cell_ll_lat, cell_ll_lon
        """
        query = SQL(query).format(
            start_date=Literal(start),
            end_date=Literal(end),
            b10=Literal(b1[0]),
            b11=Literal(b1[1]),
            b20=Literal(b2[0]),
            b21=Literal(b3[0]),
            b30=Literal(b2[1]),
            b31=Literal(b3[1])
        )

    with connection.cursor(cursor_factory=RealDictCursor) as cursor:
        cursor.execute(query)
        results = cursor.fetchall()

    pixels = []

    for r in results:
        pixels.append({
            "lat": r['lat'],
            "lon": r['lon'],
            "tfh": r['tfh']
        })

    return jsonify(pixels), 200


@app.route('/getLcV', methods=["GET", "POST"])
@cross_origin(origins=cors_origins)
def getLcV():
    """
    Request method for getting data for the comparison view.
    """
    connection = connect(host=HOST, port=PORT, dbname=DB, user=DB_USER, password=DB_PASS)

    b1 = [0, 1]
    b2 = [0, 2]
    b3 = [0, 3]
    bl = [0, 0]  # lat lng
    tr = [0.1, 0.1]  # lat lng
    start = request.args.get("start", "2020-01-01", type=str)
    end = request.args.get("end", "2020-01-31", type=str)
    bl[0] = request.args.get("bl[0]", 0, type=float)
    bl[1] = request.args.get("bl[1]", 0, type=float)
    tr[0] = request.args.get("tr[0]", 10, type=float)
    tr[1] = request.args.get("tr[1]", 10, type=float)
    batchNum = request.args.get("batch", 0, type=int)
    b1[0] = request.args.get("b1[0]", 0, type=int)
    b1[1] = request.args.get("b1[1]", 0, type=int)
    b2[0] = request.args.get("b2[0]", 0, type=int)
    b2[1] = request.args.get("b2[1]", 0, type=int)
    b3[0] = request.args.get("b3[0]", 0, type=int)
    b3[1] = request.args.get("b3[1]", 0, type=int)

    query = """
    select cell_ll_lat as lat, cell_ll_lon as lon, sum(fishing_hours) as tfh
    from "FishingHours"
    where
    cell_ll_lat between {bl_lat} and {tr_lat}
    and 
    cell_ll_lon between {bl_lon} and {tr_lon}
    and 
    "date" between {start_date}::date AND {end_date}::date
    """
    if (batchNum == 0):
        query += """
        group by cell_ll_lat, cell_ll_lon
        """
        query = SQL(query).format(
            bl_lat=Literal(bl[0]),
            tr_lat=Literal(tr[0]),
            bl_lon=Literal(bl[1]),
            tr_lon=Literal(tr[1]),
            start_date=Literal(start),
            end_date=Literal(end)
        )
    elif (batchNum == 1):
        query = """
        AND
        mmsi between {b10} AND {b11}  
        group by cell_ll_lat, cell_ll_lon
        """
        query = SQL(query).format(
            bl_lat=Literal(bl[0]),
            tr_lat=Literal(tr[0]),
            bl_lon=Literal(bl[1]),
            tr_lon=Literal(tr[1]),
            start_date=Literal(start),
            end_date=Literal(end),
            b10=Literal(b1[0]),
            b11=Literal(b1[1])
        )
    elif (batchNum == 2):
        query = """
        AND
        (mmsi between {b10} AND {b11} OR mmsi between {b20} AND {b21})  
        group by cell_ll_lat, cell_ll_lon
        """
        query = SQL(query).format(
            bl_lat=Literal(bl[0]),
            tr_lat=Literal(tr[0]),
            bl_lon=Literal(bl[1]),
            tr_lon=Literal(tr[1]),
            start_date=Literal(start),
            end_date=Literal(end),
            b10=Literal(b1[0]),
            b11=Literal(b1[1]),
            b20=Literal(b2[0]),
            b21=Literal(b2[1])
        )
    elif (batchNum == 3):
        query = """
        AND
        (mmsi between {b10} AND {b11} OR mmsi between {b20} AND {b21} OR mmsi between {b30} AND {b31})  
        group by cell_ll_lat, cell_ll_lon
        """
        query = SQL(query).format(
            bl_lat=Literal(bl[0]),
            tr_lat=Literal(tr[0]),
            bl_lon=Literal(bl[1]),
            tr_lon=Literal(tr[1]),
            start_date=Literal(start),
            end_date=Literal(end),
            b10=Literal(b1[0]),
            b11=Literal(b1[1]),
            b20=Literal(b2[0]),
            b21=Literal(b2[1]),
            b30=Literal(b3[0]),
            b31=Literal(b3[1])
        )
    with connection.cursor(cursor_factory=RealDictCursor) as cursor:
        cursor.execute(query)
        results = cursor.fetchall()

    pixels = []

    for r in results:
        pixels.append({
            "lat": r['lat'],
            "lon": r['lon'],
            "tfh": r['tfh']
        })

    return jsonify(pixels), 200


@app.route('/getChartData', methods=['GET', 'POST'])
@cross_origin(origins=cors_origins)
def getChartData():
    """
    Request method for getting chart timeseries data.
    """
    connection = connect(host=HOST, port=PORT, dbname=DB, user=DB_USER, password=DB_PASS)

    b1 = [0, 1]
    b2 = [0, 2]
    b3 = [0, 3]
    bl = [0, 0]  # lat lng
    tr = [0.1, 0.1]  # lat lng
    start = request.args.get("start", "2020-01-01", type=str)
    end = request.args.get("end", "2020-12-31", type=str)
    bl[0] = request.args.get("bl[0]", -10000, type=float)
    bl[1] = request.args.get("bl[1]", -10000, type=float)
    tr[0] = request.args.get("tr[0]", -10000, type=float)
    tr[1] = request.args.get("tr[1]", -10000, type=float)
    batchNum = request.args.get("batch", 0, type=int)
    b1[0] = request.args.get("b1[0]", 0, type=int)
    b1[1] = request.args.get("b1[1]", 0, type=int)
    b2[0] = request.args.get("b2[0]", 0, type=int)
    b2[1] = request.args.get("b2[1]", 0, type=int)
    b3[0] = request.args.get("b3[0]", 0, type=int)
    b3[1] = request.args.get("b3[1]", 0, type=int)
    if (bl[0] == -10000 or bl[1] == -10000 or tr[0] == -10000 or tr[1] == -10000):
        query = """
        select date as dat, sum(fishing_hours) as tfh
        from "FishingHours"
        where
        date between {start_date}::date AND {end_date}::date
        """ 
        if (batchNum == 0):
            query += """
            group by date
            order by date
            """
            query = SQL(query).format(
                start_date=Literal(start),
                end_date=Literal(end)
            )
        elif (batchNum == 1):
            query += """
            AND
            mmsi between {b10} AND {b11}  
            group by date
            order by date
            """
            query = SQL(query).format(
                start_date=Literal(start),
                end_date=Literal(end),
                b10=Literal(b1[0]),
                b11=Literal(b1[1])
            )
        elif (batchNum == 2):
            query += """
            AND
            (mmsi between {b10} AND {b11} OR mmsi between {b20} AND {b21})  
            group by date
            order by date
            """
            query = SQL(query).format(
                start_date=Literal(start),
                end_date=Literal(end),
                b10=Literal(b1[0]),
                b11=Literal(b1[1]),
                b20=Literal(b2[0]),
                b21=Literal(b2[1])
            )
        elif (batchNum == 3):
            query += """
            AND
            (mmsi between {b10} AND {b11} OR mmsi between {b20} AND {b21} OR mmsi between {b30} AND {b31})  
            group by date
            order by date
            """
            query = SQL(query).format(
                start_date=Literal(start),
                end_date=Literal(end),
                b10=Literal(b1[0]),
                b11=Literal(b1[1]),
                b20=Literal(b2[0]),
                b21=Literal(b2[1]),
                b30=Literal(b3[0]),
                b31=Literal(b3[1])
            )
    elif (bl[0] > -10000 and bl[1] > -10000 and tr[0] > -10000 and tr[1] > -10000):
        query = """
        select date as dat, sum(fishing_hours) as tfh
        from "FishingHours"
        where
        cell_ll_lat between {bl_lat} and {tr_lat}
        and 
        cell_ll_lon between {bl_lon} and {tr_lon}
        and 
        "date" between {start_date}::date AND {end_date}::date
        """
        if (batchNum == 0):
            query += """
            group by date
            order by date
            """
            query = SQL(query).format(
                bl_lat=Literal(bl[0]),
                tr_lat=Literal(tr[0]),
                bl_lon=Literal(bl[1]),
                tr_lon=Literal(tr[1]),
                start_date=Literal(start),
                end_date=Literal(end)
            )
        elif (batchNum == 1):
            query += """
            AND
            mmsi between {b10} AND {b11}
            group by date
            order by date
            """
            query = SQL(query).format(
                bl_lat=Literal(bl[0]),
                tr_lat=Literal(tr[0]),
                bl_lon=Literal(bl[1]),
                tr_lon=Literal(tr[1]),
                start_date=Literal(start),
                end_date=Literal(end)
            )
        elif (batchNum == 2):
            query += """
            AND
            (mmsi between {b10} AND {b11} OR mmsi between {b20} AND {b21})
            group by date
            order by date
            """
            query = SQL(query).format(
                bl_lat=Literal(bl[0]),
                tr_lat=Literal(tr[0]),
                bl_lon=Literal(bl[1]),
                tr_lon=Literal(tr[1]),
                start_date=Literal(start),
                end_date=Literal(end),
                b10=Literal(b1[0]),
                b11=Literal(b1[1]),
                b20=Literal(b2[0]),
                b21=Literal(b2[1])
            )
        elif (batchNum == 3):
            query += """
            AND
            (mmsi between {b10} AND {b11} OR mmsi between {b20} AND {b21} OR mmsi between {b30} AND {b31})  
            group by date
            order by date
            """
            query = SQL(query).format(
                bl_lat=Literal(bl[0]),
                tr_lat=Literal(tr[0]),
                bl_lon=Literal(bl[1]),
                tr_lon=Literal(tr[1]),
                start_date=Literal(start),
                end_date=Literal(end),
                b10=Literal(b1[0]),
                b11=Literal(b1[1]),
                b20=Literal(b2[0]),
                b21=Literal(b2[1]),
                b30=Literal(b3[0]),
                b31=Literal(b3[1])
            )

    with connection.cursor(cursor_factory=RealDictCursor) as cursor:
        cursor.execute(query)
        results = cursor.fetchall()

    pixels = []

    for r in results:
        pixels.append({
            "date": r['dat'],
            "tfh": r['tfh']
        })

    return jsonify(pixels), 200

if __name__ == "__main__":
    # app.run(host='0.0.0.0', port=5000, debug=True, threaded=True)
    app.run()
