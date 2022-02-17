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
        host="172.19.64.1", port=5432, dbname="BP_DB", user="BP_USER", password="BP_PASS")

    start = request.args.get("start", "2020-01-01", type=str)
    end = request.args.get("end", "2020-01-31", type=str)

    query = """
    select cell_ll_lat as lat, cell_ll_lon as lon, sum(fishing_hours) as tfh
    from "2020"
    where
    cell_ll_lat between 20 and 30
	and 
	cell_ll_lon between 110 and 120
	and 
    fdate between %s AND %s
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
