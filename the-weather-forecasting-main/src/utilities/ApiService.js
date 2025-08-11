const GEO_API_URL = 'https://geocoding-api.open-meteo.com/v1';
const OPEN_METEO_API_URL = 'https://api.open-meteo.com/v1/forecast';

function mapWmoToDescription(code) {
  const map = {
    0: 'clear sky',
    1: 'few clouds',
    2: 'scattered clouds',
    3: 'overcast clouds',
    45: 'fog',
    48: 'fog',
    51: 'drizzle',
    53: 'drizzle',
    55: 'drizzle',
    56: 'drizzle',
    57: 'drizzle',
    61: 'light rain',
    63: 'moderate rain',
    65: 'heavy intensity rain',
    66: 'freezing rain',
    67: 'freezing rain',
    71: 'light snow',
    73: 'snow',
    75: 'Heavy snow',
    77: 'snow',
    80: 'shower rain',
    81: 'shower rain',
    82: 'shower rain',
    85: 'Snow',
    86: 'Heavy shower snow',
    95: 'thunderstorm',
    96: 'thunderstorm',
    99: 'thunderstorm',
  };
  return map[code] ?? 'unknown';
}

function mapWmoToIconBase(code, isDay) {
  const dayNight = isDay ? 'd' : 'n';
  let base = '01';
  if (code === 0) base = '01';
  else if (code === 1) base = '02';
  else if (code === 2) base = '03';
  else if (code === 3) base = '04';
  else if (code === 45 || code === 48) base = '50';
  else if ([51, 53, 55, 56, 57, 80, 81, 82].includes(code)) base = '09';
  else if ([61, 63, 65].includes(code)) base = '10';
  else if ([66, 67, 71, 73, 75, 77, 85, 86].includes(code)) base = '13';
  else if ([95, 96, 99].includes(code)) base = '11';
  return `${base}${dayNight}`;
}

function toOwForecastListFromHourly(hourly, isDaySeries) {
  const time = hourly?.time || [];
  const temperature = hourly?.temperature_2m || [];
  const humidity = hourly?.relative_humidity_2m || [];
  const clouds = hourly?.cloud_cover || [];
  const wind = hourly?.wind_speed_10m || [];
  const codes = hourly?.weather_code || [];

  const list = [];
  for (let i = 0; i < time.length; i++) {
    const ts = time[i];
    const dtObj = new Date(ts);
    const dt = Math.floor(dtObj.getTime() / 1000);
    const dtTxt = ts.replace('T', ' ').slice(0, 16) + ':00';

    const code = codes[i];
    const desc = mapWmoToDescription(code);
    const icon = mapWmoToIconBase(code, (isDaySeries?.[i] ?? 1) === 1);

    list.push({
      dt,
      dt_txt: dtTxt,
      main: {
        temp: temperature[i],
        humidity: humidity[i],
      },
      wind: { speed: wind[i] },
      clouds: { all: clouds[i] },
      weather: [{ description: desc, icon }],
    });
  }
  return list;
}

export async function fetchWeatherData(lat, lon) {
  try {
    const params = new URLSearchParams({
      latitude: String(lat),
      longitude: String(lon),
      hourly: [
        'temperature_2m',
        'relative_humidity_2m',
        'cloud_cover',
        'wind_speed_10m',
        'weather_code',
        'is_day',
      ].join(','),
      current: [
        'temperature_2m',
        'apparent_temperature',
        'relative_humidity_2m',
        'weather_code',
        'cloud_cover',
        'wind_speed_10m',
        'is_day',
      ].join(','),
      wind_speed_unit: 'ms',
      timezone: 'auto',
      forecast_days: '7',
    });

    const response = await fetch(`${OPEN_METEO_API_URL}?${params.toString()}`);
    const data = await response.json();

    const current = data.current || {};
    const currentWeather = {
      main: {
        temp: current.temperature_2m,
        feels_like: current.apparent_temperature,
        humidity: current.relative_humidity_2m,
      },
      wind: { speed: current.wind_speed_10m },
      clouds: { all: current.cloud_cover },
      weather: [
        {
          description: mapWmoToDescription(current.weather_code),
          icon: mapWmoToIconBase(current.weather_code, current.is_day === 1),
        },
      ],
    };

    const hourly = data.hourly || {};
    const forecastList = toOwForecastListFromHourly(hourly, hourly.is_day);
    const forecastResponse = { list: forecastList };

    return [currentWeather, forecastResponse];
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function fetchCities(input) {
  try {
    if (!input || input.trim().length === 0) {
      return { data: [] };
    }

    const params = new URLSearchParams({
      name: input,
      count: '10',
      language: 'en',
      format: 'json',
    });

    const res = await fetch(`${GEO_API_URL}/search?${params.toString()}`);
    const json = await res.json();

    const results = json?.results || [];
    const data = results.map((city) => ({
      name: city.name,
      countryCode: city.country_code,
      latitude: city.latitude,
      longitude: city.longitude,
    }));

    return { data };
  } catch (error) {
    console.log(error);
    return { data: [] };
  }
}
