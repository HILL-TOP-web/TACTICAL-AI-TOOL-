'use strict';

class ResourceForecast {
    constructor(options = {}) {
        this.options = {
            defaultHours:
                options.defaultHours || 72,

            ...options
        };
    }

    forecast(input = {}) {
        const {
            supplies = [],
            hours =
                this.options.defaultHours
        } = input;

        const results =
            supplies.map(
                supply =>
                    this.forecastSupply(
                        supply,
                        hours
                    )
            );

        return {
            generatedAt:
                Date.now(),

            horizonHours:
                hours,

            resources:
                results,

            summary:
                this.createSummary(
                    results
                )
        };
    }

    forecastSupply(
        supply,
        hours
    ) {
        const daily =
            Number(
                supply.dailyConsumption
            ) || 0;

        const hourly =
            daily / 24;

        const projectedConsumption =
            hourly * hours;

        const projectedQuantity =
            supply.quantity -
            projectedConsumption;

        let status =
            'adequate';

        if (
            projectedQuantity <= 0
        ) {
            status = 'depleted';
        } else if (
            projectedQuantity <=
            supply.minimum
        ) {
            status = 'low';
        }

        const hoursRemaining =
            hourly > 0
                ? supply.quantity /
                  hourly
                : Infinity;

        return {
            id: supply.id,

            name:
                supply.name,

            currentQuantity:
                supply.quantity,

            projectedConsumption:
                this.round(
                    projectedConsumption
                ),

            projectedQuantity:
                this.round(
                    Math.max(
                        projectedQuantity,
                        0
                    )
                ),

            hoursRemaining:
                Number.isFinite(
                    hoursRemaining
                )
                    ? this.round(
                        hoursRemaining
                    )
                    : null,

            status
        };
    }

    createSummary(results) {
        return {
            total:
                results.length,

            adequate:
                results.filter(
                    item =>
                        item.status ===
                        'adequate'
                ).length,

            low:
                results.filter(
                    item =>
                        item.status ===
                        'low'
                ).length,

            depleted:
                results.filter(
                    item =>
                        item.status ===
                        'depleted'
                ).length
        };
    }

    round(value) {
        return Math.round(
            value * 1000
        ) / 1000;
    }
}

module.exports = ResourceForecast;
