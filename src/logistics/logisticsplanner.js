'use strict';

class LogisticsPlanner {
    constructor(options = {}) {
        this.options = {
            planningHorizonHours:
                options.planningHorizonHours ||
                72,

            ...options
        };
    }

    plan(input = {}) {
        const {
            supplies = [],
            personnel = [],
            equipment = [],
            horizonHours =
                this.options.planningHorizonHours
        } = input;

        const shortages =
            this.findShortages(
                supplies,
                horizonHours
            );

        const personnelStatus =
            this.analyzePersonnel(
                personnel
            );

        const equipmentStatus =
            this.analyzeEquipment(
                equipment
            );

        const actions = [];

        for (const shortage of shortages) {
            actions.push({
                type: 'REPLENISH',

                resourceId:
                    shortage.id,

                quantity:
                    shortage.required,

                priority:
                    shortage.priority
            });
        }

        return {
            generatedAt: Date.now(),

            horizonHours,

            shortages,

            personnel:
                personnelStatus,

            equipment:
                equipmentStatus,

            actions
        };
    }

    findShortages(
        supplies,
        horizonHours
    ) {
        return supplies
            .map(supply => {
                const daily =
                    Number(
                        supply.dailyConsumption
                    ) || 0;

                const projectedUse =
                    daily *
                    (
                        horizonHours /
                        24
                    );

                const remaining =
                    supply.quantity -
                    projectedUse;

                if (
                    remaining >
                    supply.minimum
                ) {
                    return null;
                }

                const target =
                    Math.max(
                        supply.minimum,
                        projectedUse
                    );

                return {
                    id: supply.id,

                    current:
                        supply.quantity,

                    required:
                        Math.max(
                            0,
                            target -
                            supply.quantity
                        ),

                    projectedRemaining:
                        remaining,

                    priority:
                        remaining <= 0
                            ? 'critical'
                            : 'high'
                };
            })
            .filter(Boolean);
    }

    analyzePersonnel(
        personnel
    ) {
        const total =
            personnel.length;

        const available =
            personnel.filter(
                person =>
                    person.status ===
                    'available'
            ).length;

        return {
            total,
            available,

            availabilityRatio:
                total
                    ? available / total
                    : 0
        };
    }

    analyzeEquipment(
        equipment
    ) {
        const total =
            equipment.length;

        const operational =
            equipment.filter(
                item =>
                    item.status ===
                    'operational'
            ).length;

        return {
            total,

            operational,

            operationalRatio:
                total
                    ? operational / total
                    : 0
        };
    }
}

module.exports = LogisticsPlanner;
