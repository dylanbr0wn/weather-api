import convert from "xml-js";
import kriging from "./kriging.js";
import * as Turf from "@turf/turf";
import { getHTML, intersect, makeArr } from "../utils/utils.js";
import * as d3 from "d3";
import axios from "axios";
import { client } from "./mongo.js";


export const loadData = async () => {
    await client.connect();
    const db = client.db("victoria-weather");

    const [{ newPoints, temp, long, lat, tempMax, tempMin }, island] = await Promise.all([
        getWeatherData(db),
        getIsland(db)
    ])

    const [_points, _rain, _time, isobands] = await Promise.all([
        savePoints(newPoints, tempMax, tempMin, db),
        getRainStats(newPoints, db),
        getObservationTime(newPoints, db),
        getIsobands(temp, long, lat, island, tempMax, tempMin, db)
    ])

    await getIntersection(isobands, island, db);
    await client.close();
    console.log("Updated DB");

};

const savePoints = async (points, max, min, db) => {

    const collection = db.collection("points-data");

    const sumTemp = Turf.featureReduce(points, (acc, feature) => acc + parseFloat(feature.properties.temperature), 0);



    const { insertedId } = await collection.insertOne({
        points,
        averageTemp: sumTemp / points.features.length,
        maxPoint: getTurfPoint(max),
        minPoint: getTurfPoint(min),
    });
    await collection.deleteMany({ _id: { $ne: insertedId } });
    return points
}

const getIsobands = async (temp, long, lat, island, tempMax, tempMin, db) => {
    var model = "exponential";
    var sigma2 = 0,
        alpha = 100;

    let variogram = kriging.train(temp, long, lat, model, sigma2, alpha);

    const bbox = Turf.bbox(island);

    const grid = Turf.pointGrid(bbox, 1.5, { units: "kilometers" });

    let newGrid = [];

    Turf.featureEach(grid, (feature) => {
        const center = Turf.centroid(feature);

        const temperature = kriging.predict(
            center.geometry.coordinates[0],
            center.geometry.coordinates[1],
            variogram
        );

        feature = Turf.simplify(feature, {
            tolerance: 1,
            highQuality: true,
            mutate: true
        });

        feature.properties = { ...feature.properties, temperature };
        newGrid.push(feature);
    });

    newGrid = Turf.featureCollection(newGrid);

    const max = tempMax.temperature.text;
    const min = tempMin.temperature.text;

    const breaks = makeArr(min, max, 15);

    let color = d3
        .scaleSequential(d3.interpolateTurbo)
        .domain(d3.extent(breaks));

    let fills = breaks.map((item) => {
        return { fill: color(item) };
    });

    // let isobands = customMarchingSquares(newGrid, breaks, fills, bbox);

    // const isolines = Turf.isolines(newGrid, breaks, {
    //     zProperty: "temperature",
    // });
    let isobands = Turf.isobands(newGrid, breaks, {
        zProperty: "temperature",
        // commonProperties: {
        //     "fill-opacity": 0.8,
        // },
        breaksProperties: fills,
    });

    const collection = db.collection("isobands");

    const { insertedId } = await collection.insertOne({
        isobands,
    });
    await collection.deleteMany({ _id: { $ne: insertedId } });
    // isobands = Turf.flatten(isobands);
    return isobands;
};
const getIntersection = async (isobands, island, db) => {
    let intersection = [];

    Turf.featureEach(isobands, (feature, i) => {
        let newFeature = intersect(feature, island, feature);
        // newFeature = Turf.flatten(Turf.cleanCoords(newFeature));
        // newFeature = Turf.simplify(newFeature, {
        //     tolerance: 0.005,
        //     highQuality: true,
        //     mutate: true
        // });
        if (newFeature) intersection.push({ ...newFeature, id: i });
    });


    intersection = Turf.featureCollection(intersection);

    const collection = db.collection("intersection");

    const { insertedId } = await collection.insertOne({
        intersection,
    });
    await collection.deleteMany({ _id: { $ne: insertedId } });
    return intersection;
};

const getTurfPoint = (point) => {
    return Turf.point(
        [
            parseFloat(point.longitude.text) - 360,
            parseFloat(point.latitude.text),
        ],
        {
            temperature: point.temperature.text,
            station_long_name: point.station_long_name?.text,
            station_name: point.station_name?.text,
            station_id: point.station_id?.text,
            elevation: point.elevation?.text,
            observation_time: point.observation_time?.text,
            timezone: point.timezone?.text,
            temperature_units: point.temperature_units?.text,
            pressure: point.pressure?.text,
            pressure_units: point.pressure_units?.text,
            pressure_trend: point.pressure_trend?.text,
            insolation: point.insolation?.text,
            insolation_units: point.insolation_units?.text,
            uv_index: point.uv_index?.text,
            uv_index_units: point.uv_index_units?.text,
            rain: point.rain?.text,
            rain_units: point.rain_units?.text,
            rain_rate: point.rain_rate?.text,
            rain_rate_units: point.rain_rate_units?.text,
            wind_speed: point.wind_speed?.text,
            wind_speed_direction: point.wind_speed_direction?.text,
            insolation_predicted: point.insolation_predicted?.text,
            insolation_predicted_units: point.insolation_predicted_units?.text,
            description: getHTML({
                temperature: point.temperature.text,
                station_long_name: point.station_long_name?.text,
                station_name: point.station_name?.text,
                station_id: point.station_id?.text,
                elevation: point.elevation?.text,
                observation_time: point.observation_time?.text,
                timezone: point.timezone?.text,
                temperature_units: point.temperature_units?.text,
                pressure: point.pressure?.text,
                pressure_units: point.pressure_units?.text,
                pressure_trend: point.pressure_trend?.text,
                insolation: point.insolation?.text,
                insolation_units: point.insolation_units?.text,
                uv_index: point.uv_index?.text,
                uv_index_units: point.uv_index_units?.text,
                rain: point.rain?.text,
                rain_units: point.rain_units?.text,
                rain_rate: point.rain_rate?.text,
                rain_rate_units: point.rain_rate_units?.text,
                wind_speed: point.wind_speed?.text,
                wind_speed_direction: point.wind_speed_direction?.text,
                insolation_predicted: point.insolation_predicted?.text,
                insolation_predicted_units:
                    point.insolation_predicted_units?.text,
            }),
        }
    );
};

const getRainStats = async (points, db) => {
    let averageRain = 0;
    let maxRain = {
        properties: {
            rain: 0,
        },
    };

    let numberReporting = 0;

    Turf.featureEach(points, (point) => {
        let rain = parseFloat(point.properties.rain);
        let rainRate = parseFloat(point.properties.rain_rate);

        if (rainRate || rainRate !== 0) numberReporting += 1;

        if (rain || rain === 0) {
            averageRain += rain;

            if (rain > parseFloat(maxRain.properties.rain)) maxRain = point;
        }
    });

    averageRain = averageRain / points.features.length;

    const collection = db.collection("rain-stats");

    const { insertedId } = await collection.insertOne({ maxRain, averageRain, numberReporting });
    await collection.deleteMany({ _id: { $ne: insertedId } });

    return { maxRain, averageRain, numberReporting };
};

const getObservationTime = async (points, db) => {
    const observation_time = points.features[0].properties.observation_time

    const collection = db.collection("last-observation");

    const { insertedId } = await collection.insertOne({ observation_time });
    await collection.deleteMany({ _id: { $ne: insertedId } });



    return observation_time;
};


async function getWeatherData() {
    const { data: xml } = await axios.get(
        "https://www.victoriaweather.ca/stations/latest/allcurrent.xml",
        {
            headers: {
                Accept: "application/xml",
            },
        }
    );
    const jsData = convert.xml2js(xml, {
        compact: true,
        spaces: 4,
        nativeType: true,
        textKey: "text",
    });

    let dataPoints = jsData.current_conditions.current_observation;

    dataPoints = dataPoints.filter(
        (point) => point.temperature && parseFloat(point.latitude.text) < 60
    );

    const long = [], lat = [], temp = [];

    let newPoints = [];

    let tempMax = {
        temperature: {
            text: -100,
        },
    };
    let tempMin = {
        temperature: {
            text: 100,
        },
    };

    dataPoints.forEach((point) => {
        long.push(parseFloat(point.longitude.text) - 360);
        lat.push(parseFloat(point.latitude.text));
        temp.push(parseFloat(point.temperature.text));

        if (parseFloat(point.temperature.text) > tempMax.temperature.text)
            tempMax = point;

        if (parseFloat(point.temperature.text) < tempMin.temperature.text)
            tempMin = point;

        newPoints.push(getTurfPoint(point));
    });
    newPoints = Turf.featureCollection(newPoints);
    return { newPoints, temp, long, lat, tempMax, tempMin };
}


async function getIsland(db) {
    const island = Turf.feature({
        coordinates: [
            [
                [-125.67796453456866, 48.82645842964928],
                [-124.74626480947109, 48.53388081242173],
                [-124.12134426214962, 48.352987949471014],
                [-123.75775412552608, 48.25473525182136],
                [-123.29190426297728, 48.28498699578307],
                [-123.14419576997425, 48.40581492060613],
                [-123.1328335782046, 48.66912781249633],
                [-123.16692015351316, 48.93853594737391],
                [-123.63277001606194, 49.31772215481024],
                [-124.20087960453596, 49.38433647100575],
                [-124.65536727531511, 49.70870880764804],
                [-125.09849275432498, 50.02363012281822],
                [-125.337098781484, 50.27844702316449],
                [-125.98474371234477, 50.45239434476167],
                [-126.62102645143548, 50.61128627109824],
                [-127.39365549176037, 50.83427177039019],
                [-127.82541877900061, 51.01332638323149],
                [-128.51851247693878, 50.9059763143982],
                [-128.65485877817255, 50.242127725727585],
                [-128.06402480615964, 49.7527745974472],
                [-127.15504946460135, 49.26584864698222],
                [-125.67796453456866, 48.82645842964928],
            ],
        ],
        type: "Polygon",
    });

    const collection = db.collection("island");

    const { insertedId } = await collection.insertOne({ island });
    await collection.deleteMany({ _id: { $ne: insertedId } });

    return island
}