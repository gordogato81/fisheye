from flask import Flask, jsonify, request
from flask_cors import CORS
import json

import psycopg2
from psycopg2.extras import RealDictCursor

app = Flask(__name__)
CORS(app)


@app.route("/")
def home():
    return "Hello, Flask!"


@app.route('/getQuadValues', methods=["GET", "POST"])
def getQuadValues():
    connection = psycopg2.connect(
        host="charon04.inf.uni-konstanz.de", port=5432, dbname="fishingdb", user="wittekindt", password="HLFiqcjkJLOfcfOysnLR")

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
    query = ''
    if (batchNum == 0):
        print("I am at: ", batchNum)
        query = """
        select cell_ll_lat as lat, cell_ll_lon as lon, sum(fishing_hours) as tfh
        from "FishingHours"
        where
        date between %s AND %s
        AND fishing_hours > 0
        group by cell_ll_lat, cell_ll_lon
        """
    elif (batchNum == 1): 
        print("I am at: ", batchNum)
        query = """
        select cell_ll_lat as lat, cell_ll_lon as lon, sum(fishing_hours) as tfh
        from "FishingHours"
        where
        date between %s AND %s
        AND
        mmsi between %s AND %s  
        AND fishing_hours > 0
        group by cell_ll_lat, cell_ll_lon
        """
    elif (batchNum == 2): 
        print("I am at: ", batchNum)
        query = """
        select cell_ll_lat as lat, cell_ll_lon as lon, sum(fishing_hours) as tfh
        from "FishingHours"
        where
        date between %s AND %s
        AND
        (mmsi between %s and %s OR mmsi between %s and %s) 
        AND fishing_hours > 0
        group by cell_ll_lat, cell_ll_lon
        """
    elif (batchNum == 3): 
        print("I am at: ", batchNum)
        query = """
        select cell_ll_lat as lat, cell_ll_lon as lon, sum(fishing_hours) as tfh
        from "FishingHours"
        where
        date between %s AND %s
        AND
        (mmsi between %s and %s OR mmsi between %s and %s OR mmsi between %s and %s) 
        AND fishing_hours > 0
        group by cell_ll_lat, cell_ll_lon
        """
        
        

    with connection.cursor(cursor_factory=RealDictCursor) as cursor:
        if (batchNum == 0):
            query = cursor.mogrify(query, (start, end))
        elif (batchNum == 1): 
            query = cursor.mogrify(query, (start, end, b1[0], b1[1]))
        elif (batchNum == 2): 
            query = cursor.mogrify(query, (start, end, b1[0], b1[1], b2[0], b2[1]))
        elif (batchNum == 3): 
            query = cursor.mogrify(query, (start, end, b1[0], b1[1], b2[0], b2[1], b3[0], b3[1]))
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
    connection = psycopg2.connect(
        host="charon04.inf.uni-konstanz.de", port=5432, dbname="fishingdb", user="wittekindt", password="HLFiqcjkJLOfcfOysnLR")

    bl = [0, 0]  # lat lng
    tr = [0.1, 0.1]  # lat lng
    start = request.args.get("start", "2020-01-01", type=str)
    end = request.args.get("end", "2020-01-31", type=str)
    bl[0] = request.args.get("bl[0]", 0, type=float)
    bl[1] = request.args.get("bl[1]", 0, type=float)
    tr[0] = request.args.get("tr[0]", 10, type=float)
    tr[1] = request.args.get("tr[1]", 10, type=float)

    query = """
    select cell_ll_lat as lat, cell_ll_lon as lon, sum(fishing_hours) as tfh
    from "FishingHours"
    where
    cell_ll_lat between %s and %s
    and 
    cell_ll_lon between %s and %s
    and 
    date between %s AND %s
    AND fishing_hours > 0
    group by cell_ll_lat, cell_ll_lon
    """

    with connection.cursor(cursor_factory=RealDictCursor) as cursor:
        query = cursor.mogrify(
            query, (bl[0], tr[0], bl[1], tr[1], start, end))
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


@app.route('/getDV', methods=["GET", "POST"])
def getDV():
    connection = psycopg2.connect(
        host="charon04.inf.uni-konstanz.de", port=5432, dbname="fishingdb", user="wittekindt", password="HLFiqcjkJLOfcfOysnLR")

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
    query = ''
    if (batchNum == 0):
        print("I am at: ", batchNum)
        query = """
        select cell_ll_lat as lat, cell_ll_lon as lon, sum(fishing_hours) as tfh
        from "FishingHours"
        where
        date between %s AND %s
        AND fishing_hours > 0
        group by cell_ll_lat, cell_ll_lon
        """
    elif (batchNum == 1): 
        print("I am at: ", batchNum)
        query = """
        select cell_ll_lat as lat, cell_ll_lon as lon, sum(fishing_hours) as tfh
        from "FishingHours"
        where
        date between %s AND %s
        AND
        mmsi between %s AND %s  
        AND fishing_hours > 0
        group by cell_ll_lat, cell_ll_lon
        """
    elif (batchNum == 2): 
        print("I am at: ", batchNum)
        query = """
        select cell_ll_lat as lat, cell_ll_lon as lon, sum(fishing_hours) as tfh
        from "FishingHours"
        where
        date between %s AND %s
        AND
        (mmsi between %s and %s OR mmsi between %s and %s) 
        AND fishing_hours > 0
        group by cell_ll_lat, cell_ll_lon
        """
    elif (batchNum == 3): 
        print("I am at: ", batchNum)
        query = """
        select cell_ll_lat as lat, cell_ll_lon as lon, sum(fishing_hours) as tfh
        from "FishingHours"
        where
        date between %s AND %s
        AND
        (mmsi between %s and %s OR mmsi between %s and %s OR mmsi between %s and %s) 
        AND fishing_hours > 0
        group by cell_ll_lat, cell_ll_lon
        """
        
        

    with connection.cursor(cursor_factory=RealDictCursor) as cursor:
        if (batchNum == 0):
            query = cursor.mogrify(query, (start, end))
        elif (batchNum == 1): 
            query = cursor.mogrify(query, (b1[0], b1[1], start, end))
        elif (batchNum == 2): 
            query = cursor.mogrify(query, (b1[0], b1[1], b2[0], b2[1], start, end))
        elif (batchNum == 3): 
            query = cursor.mogrify(query, (b1[0], b1[1], b2[0], b2[1], b3[0], b3[1], start, end))
        cursor.execute(query)
        results = cursor.fetchall()

    pixels = []
    # [r['lat'], r['lon'], r['tfh']]

    for r in results:
        pixels.append({
            "coords": [r['lon'], r['lat']],
            "tfh": r['tfh']
        })

    # {"points": pixels}
    return jsonify(pixels), 200
