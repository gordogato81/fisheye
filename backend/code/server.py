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

    start = request.args.get("start", "2020-01-01", type=str)
    end = request.args.get("end", "2020-01-31", type=str)

    query = """
    select cell_ll_lat as lat, cell_ll_lon as lon, sum(fishing_hours) as tfh
    from "2020"
    where
    date between %s AND %s
    AND fishing_hours > 0
    group by cell_ll_lat, cell_ll_lon
    """

    with connection.cursor(cursor_factory=RealDictCursor) as cursor:
        query = cursor.mogrify(
            query, (start, end))
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

    start = request.args.get("start", "2020-01-01", type=str)
    end = request.args.get("end", "2020-01-05", type=str)

    query = """
    select cell_ll_lat as lat, cell_ll_lon as lon, sum(fishing_hours) as tfh
    from "2020"
    where
    date between %s AND %s
    AND fishing_hours > 0
    group by cell_ll_lat, cell_ll_lon
    """

    with connection.cursor(cursor_factory=RealDictCursor) as cursor:
        query = cursor.mogrify(
            query, (start, end))
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
