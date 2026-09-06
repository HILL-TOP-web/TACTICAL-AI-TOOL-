/**
 * environment.js
 *
 * Represents environmental conditions in the simulation.
 */

export class Environment {
    constructor(data = {}) {
        this.terrain = data.terrain || "unknown";

        this.weather = {
            temperature: data.weather?.temperature ?? 25,
            precipitation: data.weather?.precipitation ?? 0,
            visibility: data.weather?.visibility ?? 10000,
            windSpeed: data.weather?.windSpeed ?? 0,
            windDirection: data.weather?.windDirection ?? 0,
            humidity: data.weather?.humidity ?? 50,
            cloudCover: data.weather?.cloudCover ?? 0
        };

        this.light = {
            level: data.light?.level ?? 1,
            dayNight: data.light?.dayNight || "day"
        };

        this.hazards = Array.isArray(data.hazards)
            ? [...data.hazards]
            : [];

        this.properties = {
            ...(data.properties || {})
        };
    }

    update(context) {
        this._updateDayNight(context.time);

        return this;
    }

    _updateDayNight(timestamp) {
        const date = new Date(timestamp);

        const hour = date.getHours();

        if (hour >= 6 && hour < 18) {
            this.light.dayNight = "day";
            this.light.level = 1;
        } else if (
            hour >= 18 &&
            hour < 21
        ) {
            this.light.dayNight = "dusk";
            this.light.level = 0.5;
        } else if (
            hour >= 4 &&
            hour < 6
        ) {
            this.light.dayNight = "dawn";
            this.light.level = 0.5;
        } else {
            this.light.dayNight = "night";
            this.light.level = 0.15;
        }
    }

    setWeather(weather = {}) {
        this.weather = {
            ...this.weather,
            ...weather
        };

        return this;
    }

    setTerrain(terrain) {
        this.terrain = terrain;

        return this;
    }

    addHazard(hazard) {
        this.hazards.push({
            id: hazard.id || `hazard-${Date.now()}`,
            type: hazard.type || "unknown",
            severity: hazard.severity ?? 1,
            ...hazard
        });

        return this;
    }

    removeHazard(id) {
        this.hazards = this.hazards.filter(
            hazard => hazard.id !== id
        );

        return this;
    }

    merge(data = {}) {
        if (data.weather) {
            this.setWeather(data.weather);
        }

        if (data.terrain) {
            this.terrain = data.terrain;
        }

        if (data.light) {
            this.light = {
                ...this.light,
                ...data.light
            };
        }

        if (data.properties) {
            this.properties = {
                ...this.properties,
                ...data.properties
            };
        }

        if (Array.isArray(data.hazards)) {
            this.hazards = [...data.hazards];
        }

        return this;
    }

    getVisibilityFactor() {
        const visibility =
            Math.max(0, this.weather.visibility);

        return Math.min(
            1,
            visibility / 10000
        );
    }

    getWeatherSeverity() {
        let severity = 0;

        severity += Math.min(
            1,
            this.weather.precipitation / 50
        );

        severity += Math.min(
            1,
            this.weather.windSpeed / 30
        );

        severity +=
            1 - this.getVisibilityFactor();

        return Math.min(
            1,
            severity / 3
        );
    }

    snapshot() {
        return structuredClone({
            terrain: this.terrain,
            weather: this.weather,
            light: this.light,
            hazards: this.hazards,
            properties: this.properties
        });
    }
          }
