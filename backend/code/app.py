from flask import Flask, jsonify, request
from flask_cors import CORS

import psycopg2
from psycopg2.extras import RealDictCursor
import os

app = Flask(__name__)
CORS(app)

HOST = os.environ['DB_HOST']
DB = os.environ['POSTGRES_DB']
DB_USER = os.environ['POSTGRES_USER']
DB_PASS = os.environ['POSTGRES_PASSWORD']
PORT = os.environ['DB_PORT']


@app.route('/getQuadValues', methods=["GET", "POST"])
def getQuadValues():
    connection = psycopg2.connect(host=HOST, port=PORT, dbname=DB, user=DB_USER, password=DB_PASS)

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

    if (batchNum == 0):
        query = """
        select cell_ll_lat as lat, cell_ll_lon as lon, sum(fishing_hours) as tfh
        from "FishingHours"
        where
        date between %s AND %s
        group by cell_ll_lat, cell_ll_lon
        """
    elif (batchNum == 1):
        query = """
        select cell_ll_lat as lat, cell_ll_lon as lon, sum(fishing_hours) as tfh
        from "FishingHours"
        where
        date between %s AND %s
        AND
        mmsi between %s AND %s  
        group by cell_ll_lat, cell_ll_lon
        """
    elif (batchNum == 2):
        query = """
        select cell_ll_lat as lat, cell_ll_lon as lon, sum(fishing_hours) as tfh
        from "FishingHours"
        where
        date between %s AND %s
        AND
        (mmsi between %s and %s OR mmsi between %s and %s) 
        group by cell_ll_lat, cell_ll_lon
        """
    elif (batchNum == 3):
        query = """
        select cell_ll_lat as lat, cell_ll_lon as lon, sum(fishing_hours) as tfh
        from "FishingHours"
        where
        date between %s AND %s
        AND
        (mmsi between %s and %s OR mmsi between %s and %s OR mmsi between %s and %s) 
        group by cell_ll_lat, cell_ll_lon
        """

    with connection.cursor(cursor_factory=RealDictCursor) as cursor:
        if (batchNum == 0):
            query = cursor.mogrify(query, (start, end))
        elif (batchNum == 1):
            query = cursor.mogrify(query, (start, end, b1[0], b1[1]))
        elif (batchNum == 2):
            query = cursor.mogrify(
                query, (start, end, b1[0], b1[1], b2[0], b2[1]))
        elif (batchNum == 3):
            query = cursor.mogrify(
                query, (start, end, b1[0], b1[1], b2[0], b2[1], b3[0], b3[1]))
        cursor.execute(query)
        results = cursor.fetchall()

    pixels = []
    # [r['lat'], r['lon'], r['tfh']]

    for r in results:
        pixels.append({
            "lat": r['lat'],
            "lon": r['lon'],
            "tfh": r['tfh']
        })

    # {"points": pixels}
    return jsonify(pixels), 200


@app.route('/getLcV', methods=["GET", "POST"])
def getLcV():
    connection = psycopg2.connect(host=HOST, port=PORT, dbname=DB, user=DB_USER, password=DB_PASS)

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

    if (batchNum == 0):
        query = """
        select cell_ll_lat as lat, cell_ll_lon as lon, sum(fishing_hours) as tfh
        from "FishingHours"
        where
        cell_ll_lat between %s and %s
        and 
        cell_ll_lon between %s and %s
        and 
        date between %s AND %s
        group by cell_ll_lat, cell_ll_lon
        """
    elif (batchNum == 1):
        query = """
        select cell_ll_lat as lat, cell_ll_lon as lon, sum(fishing_hours) as tfh
        from "FishingHours"
        where
        cell_ll_lat between %s and %s
        and 
        cell_ll_lon between %s and %s
        and 
        date between %s AND %s
        AND
        mmsi between %s AND %s  
        group by cell_ll_lat, cell_ll_lon
        """
    elif (batchNum == 2):
        query = """
        select cell_ll_lat as lat, cell_ll_lon as lon, sum(fishing_hours) as tfh
        from "FishingHours"
        where
        cell_ll_lat between %s and %s
        and 
        cell_ll_lon between %s and %s
        and 
        date between %s AND %s
        AND
        (mmsi between %s and %s OR mmsi between %s and %s)  
        group by cell_ll_lat, cell_ll_lon
        """
    elif (batchNum == 3):
        query = """
        select cell_ll_lat as lat, cell_ll_lon as lon, sum(fishing_hours) as tfh
        from "FishingHours"
        where
        cell_ll_lat between %s and %s
        and 
        cell_ll_lon between %s and %s
        and 
        date between %s AND %s
        AND
        (mmsi between %s and %s OR mmsi between %s and %s OR mmsi between %s and %s)  
        group by cell_ll_lat, cell_ll_lon
        """

    with connection.cursor(cursor_factory=RealDictCursor) as cursor:
        if (batchNum == 0):
            query = cursor.mogrify(
                query, (bl[0], tr[0], bl[1], tr[1], start, end))
        elif (batchNum == 1):
            query = cursor.mogrify(
                query, (bl[0], tr[0], bl[1], tr[1], start, end, b1[0], b1[1]))
        elif (batchNum == 2):
            query = cursor.mogrify(
                query, (bl[0], tr[0], bl[1], tr[1], start, end, b1[0], b1[1], b2[0], b2[1]))
        elif (batchNum == 3):
            query = cursor.mogrify(
                query, (bl[0], tr[0], bl[1], tr[1], start, end, b1[0], b1[1], b2[0], b2[1], b3[0], b3[1]))

        cursor.execute(query)
        results = cursor.fetchall()

    pixels = []
    # [r['lat'], r['lon'], r['tfh']]

    for r in results:
        pixels.append({
            "lat": r['lat'],
            "lon": r['lon'],
            "tfh": r['tfh']
        })

    # {"points": pixels}
    return jsonify(pixels), 200


@app.route('/getChartData', methods=['GET', 'POST'])
def getChartData():
    connection = psycopg2.connect(host=HOST, port=PORT, dbname=DB, user=DB_USER, password=DB_PASS)

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
        if (batchNum == 0):
            query = """
            select date as dat, sum(fishing_hours) as tfh
            from "FishingHours"
            where
            date between %s AND %s
            group by date
            order by date
            """
        elif (batchNum == 1):
            query = """
            select date as dat, sum(fishing_hours) as tfh
            from "FishingHours"
            where
            date between %s AND %s
            AND
            mmsi between %s AND %s  
            group by date
            order by date
            """
        elif (batchNum == 2):
            query = """
            select date as dat, sum(fishing_hours) as tfh
            from "FishingHours"
            where
            date between %s AND %s
            AND
            (mmsi between %s and %s OR mmsi between %s and %s)  
            group by date
            order by date
            """
        elif (batchNum == 3):
            query = """
            select date as dat, sum(fishing_hours) as tfh
            from "FishingHours"
            where
            date between %s AND %s
            AND
            (mmsi between %s and %s OR mmsi between %s and %s OR mmsi between %s and %s)  
            group by date
            order by date
            """
    elif (bl[0] > -10000 and bl[1] > -10000 and tr[0] > -10000 and tr[1] > -10000):
        if (batchNum == 0):
            query = """
            select date as dat, sum(fishing_hours) as tfh
            from "FishingHours"
            where
            cell_ll_lat between %s and %s
            and 
            cell_ll_lon between %s and %s
            and 
            date between %s AND %s
            group by date
            order by date
            """
        elif (batchNum == 1):
            query = """
            select date as dat, sum(fishing_hours) as tfh
            from "FishingHours"
            where
            cell_ll_lat between %s and %s
            and 
            cell_ll_lon between %s and %s
            and 
            date between %s AND %s
            AND
            mmsi between %s AND %s  
            group by date
            order by date
            """
        elif (batchNum == 2):
            query = """
            select date as dat, sum(fishing_hours) as tfh
            from "FishingHours"
            where
            cell_ll_lat between %s and %s
            and 
            cell_ll_lon between %s and %s
            and 
            date between %s AND %s
            AND
            (mmsi between %s and %s OR mmsi between %s and %s)  
            group by date
            order by date
            """
        elif (batchNum == 3):
            query = """
            select date as dat, sum(fishing_hours) as tfh
            from "FishingHours"
            where
            cell_ll_lat between %s and %s
            and 
            cell_ll_lon between %s and %s
            and 
            date between %s AND %s
            AND
            (mmsi between %s and %s OR mmsi between %s and %s OR mmsi between %s and %s)  
            group by date
            order by date
            """

    with connection.cursor(cursor_factory=RealDictCursor) as cursor:
        if (bl[0] == -10000 or bl[1] == -10000 or tr[0] == -10000 or tr[1] == -10000):
            if (batchNum == 0):
                query = cursor.mogrify(query, (start, end))
            elif (batchNum == 1):
                query = cursor.mogrify(
                    query, (start, end, b1[0], b1[1]))
            elif (batchNum == 2):
                query = cursor.mogrify(
                    query, (start, end, b1[0], b1[1], b2[0], b2[1]))
            elif (batchNum == 3):
                query = cursor.mogrify(
                    query, (start, end, b1[0], b1[1], b2[0], b2[1], b3[0], b3[1]))
        elif (bl[0] > -10000 and bl[1] > -10000 and tr[0] > -10000 and tr[1] > -10000):
            if (batchNum == 0):
                query = cursor.mogrify(
                    query, (bl[0], tr[0], bl[1], tr[1], start, end))
            elif (batchNum == 1):
                query = cursor.mogrify(
                    query, (bl[0], tr[0], bl[1], tr[1], start, end, b1[0], b1[1]))
            elif (batchNum == 2):
                query = cursor.mogrify(
                    query, (bl[0], tr[0], bl[1], tr[1], start, end, b1[0], b1[1], b2[0], b2[1]))
            elif (batchNum == 3):
                query = cursor.mogrify(
                    query, (bl[0], tr[0], bl[1], tr[1], start, end, b1[0], b1[1], b2[0], b2[1], b3[0], b3[1]))

        cursor.execute(query)
        results = cursor.fetchall()

    pixels = []
    # [r['lat'], r['lon'], r['tfh']]

    for r in results:
        pixels.append({
            "date": r['dat'],
            "tfh": r['tfh']
        })

    # {"points": pixels}
    return jsonify(pixels), 200

if __name__ == "__main__":
    # app.run(host='0.0.0.0', port=5000, debug=True, threaded=True)
    app.run()
# @app.route('/getDV', methods=["GET", "POST"])
# def getDV():
#     connection = psycopg2.connect(
#         host="charon04.inf.uni-konstanz.de", port=5432, dbname="fishingdb", user="wittekindt", password="HLFiqcjkJLOfcfOysnLR")

#     b1 = [0, 1]
#     b2 = [0, 2]
#     b3 = [0, 3]
#     start = request.args.get("start", "2020-01-01", type=str)
#     end = request.args.get("end", "2020-01-05", type=str)
#     batchNum = request.args.get("batch", 0, type=int)
#     b1[0] = request.args.get("b1[0]", 0, type=int)
#     b1[1] = request.args.get("b1[1]", 0, type=int)
#     b2[0] = request.args.get("b2[0]", 0, type=int)
#     b2[1] = request.args.get("b2[1]", 0, type=int)
#     b3[0] = request.args.get("b3[0]", 0, type=int)
#     b3[1] = request.args.get("b3[1]", 0, type=int)
#     query = ''
#     if (batchNum == 0):
#         print("I am at: ", batchNum)
#         query = """
#         select cell_ll_lat as lat, cell_ll_lon as lon, sum(fishing_hours) as tfh
#         from "FishingHours"
#         where
#         date between %s AND %s
#
#         group by cell_ll_lat, cell_ll_lon
#         """
#     elif (batchNum == 1):
#         print("I am at: ", batchNum)
#         query = """
#         select cell_ll_lat as lat, cell_ll_lon as lon, sum(fishing_hours) as tfh
#         from "FishingHours"
#         where
#         date between %s AND %s
#         AND
#         mmsi between %s AND %s
#
#         group by cell_ll_lat, cell_ll_lon
#         """
#     elif (batchNum == 2):
#         print("I am at: ", batchNum)
#         query = """
#         select cell_ll_lat as lat, cell_ll_lon as lon, sum(fishing_hours) as tfh
#         from "FishingHours"
#         where
#         date between %s AND %s
#         AND
#         (mmsi between %s and %s OR mmsi between %s and %s)
#
#         group by cell_ll_lat, cell_ll_lon
#         """
#     elif (batchNum == 3):
#         print("I am at: ", batchNum)
#         query = """
#         select cell_ll_lat as lat, cell_ll_lon as lon, sum(fishing_hours) as tfh
#         from "FishingHours"
#         where
#         date between %s AND %s
#         AND
#         (mmsi between %s and %s OR mmsi between %s and %s OR mmsi between %s and %s)
#
#         group by cell_ll_lat, cell_ll_lon
#         """

#     with connection.cursor(cursor_factory=RealDictCursor) as cursor:
#         if (batchNum == 0):
#             query = cursor.mogrify(query, (start, end))
#         elif (batchNum == 1):
#             query = cursor.mogrify(query, (b1[0], b1[1], start, end))
#         elif (batchNum == 2):
#             query = cursor.mogrify(
#                 query, (b1[0], b1[1], b2[0], b2[1], start, end))
#         elif (batchNum == 3):
#             query = cursor.mogrify(
#                 query, (b1[0], b1[1], b2[0], b2[1], b3[0], b3[1], start, end))
#         cursor.execute(query)
#         results = cursor.fetchall()

#     pixels = []
#     # [r['lat'], r['lon'], r['tfh']]

#     for r in results:
#         pixels.append({
#             "coords": [r['lon'], r['lat']],
#             "tfh": r['tfh']
#         })

#     # {"points": pixels}
#     return jsonify(pixels), 200
