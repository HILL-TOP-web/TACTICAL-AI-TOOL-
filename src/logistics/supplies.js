'use strict';

class Supplies {
    constructor(options = {}) {
        this.options = {
            defaultShelfLifeDays:
                options.defaultShelfLifeDays ||
                365,

            ...options
        };

        this.supplies = new Map();
    }

    add(supply) {
        if (
            !supply ||
            typeof supply !== 'object'
        ) {
            throw new TypeError(
                'Supply must be an object'
            );
        }

        if (!supply.id) {
            throw new Error(
                'Supply requires an id'
            );
        }

        const existing =
            this.supplies.get(
                supply.id
            );

        if (existing) {
            existing.quantity +=
                Number(supply.quantity) || 0;

            existing.updatedAt =
                Date.now();

            return existing;
        }

        const now = Date.now();

        const item = {
            id: supply.id,

            name:
                supply.name ||
                supply.id,

            category:
                supply.category ||
                'general',

            quantity:
                Number(supply.quantity) || 0,

            unit:
                supply.unit || 'unit',

            minimum:
                supply.minimum || 0,

            dailyConsumption:
                Number(
                    supply.dailyConsumption
                ) || 0,

            expirationDate:
                supply.expirationDate ||
                (
                    now +
                    this.options.defaultShelfLifeDays *
                    86400000
                ),

            metadata:
                supply.metadata || {},

            createdAt: now,

            updatedAt: now
        };

        this.supplies.set(
            item.id,
            item
        );

        return item;
    }

    consume(id, quantity) {
        const supply =
            this.get(id);

        if (!supply) {
            throw new Error(
                `Supply '${id}' not found`
            );
        }

        if (quantity <= 0) {
            throw new Error(
                'Consumption must be positive'
            );
        }

        if (quantity > supply.quantity) {
            throw new Error(
                `Insufficient supply: ${id}`
            );
        }

        supply.quantity -= quantity;

        supply.updatedAt =
            Date.now();

        return {
            id,
            consumed: quantity,
            remaining:
                supply.quantity
        };
    }

    replenish(id, quantity) {
        const supply =
            this.get(id);

        if (!supply) {
            throw new Error(
                `Supply '${id}' not found`
            );
        }

        if (quantity <= 0) {
            throw new Error(
                'Replenishment must be positive'
            );
        }

        supply.quantity += quantity;

        supply.updatedAt =
            Date.now();

        return supply;
    }

    get(id) {
        return (
            this.supplies.get(id) ||
            null
        );
    }

    getAll() {
        return Array.from(
            this.supplies.values()
        );
    }

    getLowStock() {
        return this.getAll().filter(
            supply =>
                supply.quantity <=
                supply.minimum
        );
    }

    getExpiring(days = 30) {
        const limit =
            Date.now() +
            days * 86400000;

        return this.getAll().filter(
            supply =>
                supply.expirationDate <=
                limit
        );
    }

    getExpired() {
        const now = Date.now();

        return this.getAll().filter(
            supply =>
                supply.expirationDate <=
                now
        );
    }

    remove(id) {
        return this.supplies.delete(id);
    }

    reset() {
        this.supplies.clear();
    }
}

module.exports = Supplies;
