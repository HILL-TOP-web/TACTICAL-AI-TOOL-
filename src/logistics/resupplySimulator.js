'use strict';

class ResupplySimulator {
    constructor(options = {}) {
        this.options = {
            defaultDelayHours:
                options.defaultDelayHours ?? 24,

            defaultReliability:
                options.defaultReliability ?? 0.9,

            ...options
        };
    }

    simulate(input = {}) {
        const {
            supplies = [],
            requests = [],
            delayHours =
                this.options.defaultDelayHours,

            reliability =
                this.options.defaultReliability
        } = input;

        const supplyMap =
            new Map(
                supplies.map(
                    supply => [
                        supply.id,
                        supply
                    ]
                )
            );

        const results = [];

        for (const request of requests) {
            const supply =
                supplyMap.get(
                    request.id
                );

            const quantity =
                Number(
                    request.quantity
                ) || 0;

            if (!supply) {
                results.push({
                    id: request.id,
                    status: 'unknown_resource'
                });

                continue;
            }

            const success =
                Math.random() <=
                reliability;

            results.push({
                id: request.id,

                requested:
                    quantity,

                projectedQuantity:
                    success
                        ? supply.quantity +
                          quantity
                        : supply.quantity,

                delayHours,

                status:
                    success
                        ? 'simulated_success'
                        : 'simulated_failure'
            });
        }

        return {
            generatedAt: Date.now(),

            reliability,

            delayHours,

            results
        };
    }

    createRequest(
        id,
        quantity,
        options = {}
    ) {
        return {
            id,

            quantity,

            priority:
                options.priority ||
                'normal',

            createdAt:
                Date.now(),

            metadata:
                options.metadata || {}
        };
    }
}

module.exports = ResupplySimulator;
