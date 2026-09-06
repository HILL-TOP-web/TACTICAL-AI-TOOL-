'use strict';

class Equipment {
    constructor(options = {}) {
        this.options = {
            maxEquipment:
                options.maxEquipment || 5000,

            ...options
        };

        this.items = new Map();
    }

    add(item) {
        if (
            !item ||
            typeof item !== 'object'
        ) {
            throw new TypeError(
                'Equipment must be an object'
            );
        }

        if (!item.id) {
            throw new Error(
                'Equipment requires an id'
            );
        }

        const equipment = {
            id: item.id,

            name:
                item.name ||
                item.id,

            type:
                item.type ||
                'general',

            status:
                item.status ||
                'operational',

            condition:
                item.condition ??
                1,

            capacity:
                item.capacity ??
                null,

            maintenanceDue:
                item.maintenanceDue ??
                null,

            metadata:
                item.metadata || {},

            updatedAt:
                Date.now()
        };

        this.items.set(
            equipment.id,
            equipment
        );

        this.enforceLimit();

        return equipment;
    }

    update(id, changes = {}) {
        const item =
            this.get(id);

        if (!item) {
            throw new Error(
                `Equipment '${id}' not found`
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

    setStatus(id, status) {
        return this.update(
            id,
            { status }
        );
    }

    setCondition(id, condition) {
        if (
            condition < 0 ||
            condition > 1
        ) {
            throw new Error(
                'Condition must be between 0 and 1'
            );
        }

        return this.update(
            id,
            { condition }
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

    getOperational() {
        return this.getAll().filter(
            item =>
                item.status ===
                'operational'
        );
    }

    getByType(type) {
        return this.getAll().filter(
            item =>
                item.type === type
        );
    }

    getMaintenanceDue() {
        const now = Date.now();

        return this.getAll().filter(
            item =>
                item.maintenanceDue &&
                item.maintenanceDue <=
                now
        );
    }

    remove(id) {
        return this.items.delete(id);
    }

    reset() {
        this.items.clear();
    }

    enforceLimit() {
        while (
            this.items.size >
            this.options.maxEquipment
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

module.exports = Equipment;
