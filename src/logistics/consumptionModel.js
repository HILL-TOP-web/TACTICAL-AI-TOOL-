'use strict';

class ConsumptionModel {
    constructor(options = {}) {
        this.options = {
            personnelMultiplier:
                options.personnelMultiplier ?? 1,

            equipmentMultiplier:
                options.equipmentMultiplier ?? 0.1,

            ...options
        };
    }

    calculate(input = {}) {
        const {
            supplies = [],
            personnel = [],
            equipment = [],
            durationHours = 1
        } = input;

        const personnelFactor =
            Math.max(
                personnel.length,
                1
            );

        const equipmentFactor =
            Math.max(
                equipment.length,
                1
            );

        return supplies.map(
            supply => {
                const base =
                    Number(
                        supply.dailyConsumption
                    ) || 0;

                const hourly =
                    base / 24;

                const quantity =
                    hourly *
                    durationHours *
                    personnelFactor *
                    this.options
                        .personnelMultiplier *
                    (
                        1 +
                        (
                            equipmentFactor *
                            this.options
                                .equipmentMultiplier
                        )
                    );

                return {
                    id: supply.id,

                    quantity:
                        this.round(
                            quantity
                        ),

                    unit:
                        supply.unit,

                    durationHours,

                    model: 'simulation'
                };
            }
        );
    }

    project(
        supply,
        personnelCount,
        hours
    ) {
        const daily =
            Number(
                supply.dailyConsumption
            ) || 0;

        return (
            daily /
            24 *
            hours *
            Math.max(
                personnelCount,
                1
            )
        );
    }

    round(value) {
        return Math.round(
            value * 1000
        ) / 1000;
    }
}

module.exports = ConsumptionModel;
