import React, { useState } from 'react';
import { Button } from '@mui/material';
import { reverseGeocode } from '../../api/OpenWeatherService';

const Search = ({ onSearchChange }) => {
  const [isGetting, setIsGetting] = useState(false);

  const handleGetForecast = () => {
    if (!navigator.geolocation) {
      return;
    }

    setIsGetting(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        let label = 'Current Location';
        try {
          const place = await reverseGeocode(latitude, longitude);
          if (place) {
            const { name, country, state } = place;
            label = `${name || 'Current Location'}${state ? ', ' + state : ''}${country ? ', ' + country : ''}`;
          }
        } catch (_) {
          // ignore and fallback to default label
        }

        onSearchChange({ value: `${latitude} ${longitude}`, label });
        setIsGetting(false);
      },
      () => {
        setIsGetting(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  return (
    <Button variant="contained" color="primary" onClick={handleGetForecast} disabled={isGetting}>
      {isGetting ? 'Getting forecast…' : 'Get Weather Forecast'}
    </Button>
  );
};

export default Search;
