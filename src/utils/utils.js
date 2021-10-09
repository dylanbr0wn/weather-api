import * as pc from "martinez-polygon-clipping";
import { multiPolygon, polygon } from "@turf/helpers";
import { getGeom } from "@turf/invariant";

export function intersect(poly1, poly2, options = {}) {
    const geom1 = getGeom(poly1);
    const geom2 = getGeom(poly2);

    if (!geom1.coordinates.length) return null;

    const intersection = pc.intersection(geom1.coordinates, geom2.coordinates);

    if (!intersection || intersection.length === 0) return null;
    if (intersection.length === 1) {
        return polygon(intersection[0], options.properties);
    }
    return multiPolygon(intersection, options.properties);
}

export function makeArr(startValue, stopValue, cardinality) {
    var arr = [];
    var step = (stopValue - startValue) / (cardinality - 1);
    for (var i = 0; i < cardinality; i++) {
        arr.push(startValue + step * i);
    }
    return arr;
}

// temperature: temp[i],
//                 station_long_name: dataPoints[i].station_long_name?.text,
//                 station_name: dataPoints[i].station_name?.text,
//                 station_id: dataPoints[i].station_id?.text,
//                 elevation: dataPoints[i].elevation?.text,
//                 observation_time: dataPoints[i].observation_time?.text,
//                 timezone: dataPoints[i].timezone?.text,
//                 temperature_units: dataPoints[i].temperature_units?.text,
//                 pressure: dataPoints[i].pressure?.text,
//                 pressure_units: dataPoints[i].pressure_units?.text,
//                 pressure_trend: dataPoints[i].pressure_trend?.text,
//                 insolation: dataPoints[i].insolation?.text,
//                 insolation_units: dataPoints[i].insolation_units?.text,
//                 uv_index: dataPoints[i].uv_index?.text,
//                 uv_index_units: dataPoints[i].uv_index_units?.text,
//                 rain: dataPoints[i].rain?.text,
//                 rain_units: dataPoints[i].rain_units?.text,
//                 rain_rate: dataPoints[i].rain_rate?.text,
//                 rain_rate_units: dataPoints[i].rain_rate_units?.text,
//                 wind_speed: dataPoints[i].wind_speed?.text,
//                 wind_speed_direction: dataPoints[i].wind_speed_direction?.text,
//                 insolation_predicted: dataPoints[i].insolation_predicted?.text,
//                 insolation_predicted_units:
//                     dataPoints[i].insolation_predicted_units?.text,

export const getHTML = ({
    station_long_name,
    station_id,
    observation_time,
    timezone,
    temperature_units,
    pressure,
    temperature,
    pressure_units,
    pressure_trend,
    insolation,
    insolation_units,
    insolation_predicted,
    insolation_predicted_units,
    uv_index_units,
    uv_index,
    rain_units,
    rain,
    rain_rate_units,
    rain_rate,
    wind_speed_direction,
    wind_speed,
}) => {
    return `
    Station Name: ${station_long_name ?? ""}<br>
    Station ID: ${station_id ?? ""}<br>
    Observation Time: ${observation_time ?? ""} ${timezone ?? ""}<br>
    Temperature: ${temperature ?? ""} ${temperature_units ?? ""}<br>
    Pressure: ${pressure ?? ""} ${pressure_units ?? ""}<br>
    Pressure Trend: ${pressure_trend ?? ""}<br>
    Insolation: ${insolation ?? ""} ${insolation_units ?? ""}<br>
    Insolation Predicted: ${insolation_predicted ?? ""} ${
        insolation_predicted_units ?? ""
    }<br>
    UV Index: ${uv_index ?? ""} ${uv_index_units ?? ""}<br>
    Rain: ${rain ?? ""} ${rain_units ?? ""}<br>
    Rain Rate: ${rain_rate ?? ""} ${rain_rate_units ?? ""}<br>
    Wind Speed: ${wind_speed ?? ""} ${wind_speed_direction ?? ""}<br>

    
    
    `;
};
