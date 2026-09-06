'use strict';

class Personnel {
    constructor(options = {}) {
        this.options = {
            maxPersonnel:
                options.maxPersonnel || 10000,

            ...options
        };

        this.people = new Map();
    }

    add(person) {
        if (
            !person ||
            typeof person !== 'object'
        ) {
            throw new TypeError(
                'Personnel record must be an object'
            );
        }

        if (!person.id) {
            throw new Error(
                'Personnel requires an id'
            );
        }

        const member = {
            id: person.id,

            name:
                person.name ||
                person.id,

            role:
                person.role ||
                'general',

            status:
                person.status ||
                'available',

            capacity:
                Number(person.capacity) || 1,

            attributes:
                person.attributes || {},

            metadata:
                person.metadata || {},

            updatedAt:
                Date.now()
        };

        this.people.set(
            member.id,
            member
        );

        this.enforceLimit();

        return member;
    }

    update(id, changes = {}) {
        const person =
            this.get(id);

        if (!person) {
            throw new Error(
                `Personnel '${id}' not found`
            );
        }

        Object.assign(
            person,
            changes
        );

        person.updatedAt =
            Date.now();

        return person;
    }

    setStatus(id, status) {
        return this.update(
            id,
            { status }
        );
    }

    get(id) {
        return (
            this.people.get(id) ||
            null
        );
    }

    getAll() {
        return Array.from(
            this.people.values()
        );
    }

    getActive() {
        return this.getAll().filter(
            person =>
                person.status ===
                'available' ||
                person.status ===
                'active'
        );
    }

    getByRole(role) {
        return this.getAll().filter(
            person =>
                person.role === role
        );
    }

    count() {
        return this.people.size;
    }

    remove(id) {
        return this.people.delete(id);
    }

    reset() {
        this.people.clear();
    }

    enforceLimit() {
        while (
            this.people.size >
            this.options.maxPersonnel
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

            this.people.delete(
                oldest.id
            );
        }
    }
}

module.exports = Personnel;
