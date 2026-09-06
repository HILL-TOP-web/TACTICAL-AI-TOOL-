'use strict';

class Inventory {
    constructor(options = {}) {
        this.options = {
            maxItems:
                options.maxItems || 5000,

            ...options
        };

        this.items = new Map();
    }

    add(resource) {
        this.validate(resource);

        const existing =
            this.items.get(resource.id);

        if (existing) {
            existing.quantity +=
                resource.quantity || 0;

            existing.updatedAt =
                Date.now();

            return existing;
        }

        const item = {
            id: resource.id,

            name:
                resource.name ||
                resource.id,

            category:
                resource.category ||
                'general',

            quantity:
                Number(resource.quantity) || 0,

            unit:
                resource.unit || 'unit',

            capacity:
                resource.capacity ?? null,

            minimum:
                resource.minimum ?? 0,

            maximum:
                resource.maximum ?? null,

            metadata:
                resource.metadata || {},

            createdAt:
                Date.now(),

            updatedAt:
                Date.now()
        };

        this.items.set(
            item.id,
            item
        );

        this.enforceLimit();

        return item;
    }

    remove(id, quantity) {
        const item =
            this.get(id);

        if (!item) {
            throw new Error(
                `Inventory item '${id}' not found`
            );
        }

        if (quantity <= 0) {
            throw new Error(
                'Quantity must be greater than zero'
            );
        }

        if (quantity > item.quantity) {
            throw new Error(
                `Insufficient quantity for '${id}'`
            );
        }

        item.quantity -= quantity;
        item.updatedAt = Date.now();

        return item;
    }

    consume(id, quantity) {
        return this.remove(
            id,
            quantity
        );
    }

    get(id) {
        return (
            this.items.get(id) ||
            null
        );
    }

    getAll() {
        return Array.from(
            this.items.values()
        );
    }

    getByCategory(category) {
        return this.getAll().filter(
            item =>
                item.category === category
        );
    }

    getLowStock() {
        return this.getAll().filter(
            item => {
                if (
                    item.maximum === null
                ) {
                    return (
                        item.quantity <=
                        item.minimum
                    );
                }

                return (
                    item.quantity /
                    item.maximum
                ) <= 0.25;
            }
        );
    }

    getCriticalStock() {
        return this.getAll().filter(
            item =>
                item.quantity <=
                item.minimum
        );
    }

    update(id, changes = {}) {
        const item =
            this.get(id);

        if (!item) {
            throw new Error(
                `Inventory item '${id}' not found`
            );
        }

        Object.assign(
            item,
            changes
        );

        item.updatedAt =
            Date.now();

        return item;
    }

    setQuantity(id, quantity) {
        if (quantity < 0) {
            throw new Error(
                'Quantity cannot be negative'
            );
        }

        return this.update(
            id,
            { quantity }
        );
    }

    count() {
        return this.items.size;
    }

    reset() {
        this.items.clear();
    }

    validate(resource) {
        if (
            !resource ||
            typeof resource !== 'object'
        ) {
            throw new TypeError(
                'Resource must be an object'
            );
        }

        if (!resource.id) {
            throw new Error(
                'Resource requires an id'
            );
        }
    }

    enforceLimit() {
        while (
            this.items.size >
            this.options.maxItems
        ) {
            const oldest =
                this.getAll().sort(
                    (a, b) =>
                        a.updatedAt -
                        b.updatedAt
                )[0];

            if (!oldest) {
                break;
            }

            this.items.delete(
                oldest.id
            );
        }
    }
}

module.exports = Inventory;
