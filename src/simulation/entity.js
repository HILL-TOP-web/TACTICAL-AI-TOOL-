/**
 * entity.js
 *
 * Represents an object existing inside the simulated world.
 */

export class Entity {
    constructor(data = {}) {
        this.id = data.id || `entity-${Date.now()}`;

        this.type = data.type || "unknown";

        this.name = data.name || this.id;

        this.position = {
            x: data.position?.x ?? 0,
            y: data.position?.y ?? 0,
            z: data.position?.z ?? 0
        };

        this.velocity = {
            x: data.velocity?.x ?? 0,
            y: data.velocity?.y ?? 0,
            z: data.velocity?.z ?? 0
        };

        this.acceleration = {
            x: data.acceleration?.x ?? 0,
            y: data.acceleration?.y ?? 0,
            z: data.acceleration?.z ?? 0
        };

        this.heading = data.heading ?? 0;

        this.speed = data.speed ?? 0;

        this.active = data.active ?? true;

        this.state = data.state || "idle";

        this.attributes = {
            ...(data.attributes || {})
        };

        this.tags = Array.isArray(data.tags)
            ? [...data.tags]
            : [];

        this.createdAt = data.createdAt || Date.now();

        this.updatedAt = Date.now();
    }

    update(context) {
        const deltaSeconds = context.deltaMs / 1000;

        this.velocity.x +=
            this.acceleration.x * deltaSeconds;

        this.velocity.y +=
            this.acceleration.y * deltaSeconds;

        this.velocity.z +=
            this.acceleration.z * deltaSeconds;

        this.position.x +=
            this.velocity.x * deltaSeconds;

        this.position.y +=
            this.velocity.y * deltaSeconds;

        this.position.z +=
            this.velocity.z * deltaSeconds;

        this.speed = Math.sqrt(
            this.velocity.x ** 2 +
            this.velocity.y ** 2 +
            this.velocity.z ** 2
        );

        if (this.speed > 0.001) {
            this.heading = Math.atan2(
                this.velocity.y,
                this.velocity.x
            );
        }

        this.updatedAt = context.currentTime;
    }

    setPosition(x, y, z = 0) {
        this.position = { x, y, z };

        return this;
    }

    setVelocity(x, y, z = 0) {
        this.velocity = { x, y, z };

        return this;
    }

    setAcceleration(x, y, z = 0) {
        this.acceleration = { x, y, z };

        return this;
    }

    setState(state) {
        this.state = state;

        return this;
    }

    addTag(tag) {
        if (!this.tags.includes(tag)) {
            this.tags.push(tag);
        }

        return this;
    }

    removeTag(tag) {
        this.tags = this.tags.filter(
            item => item !== tag
        );

        return this;
    }

    merge(data = {}) {
        if (data.position) {
            this.position = {
                ...this.position,
                ...data.position
            };
        }

        if (data.velocity) {
            this.velocity = {
                ...this.velocity,
                ...data.velocity
            };
        }

        if (data.acceleration) {
            this.acceleration = {
                ...this.acceleration,
                ...data.acceleration
            };
        }

        Object.assign(this, {
            ...data,
            position: this.position,
            velocity: this.velocity,
            acceleration: this.acceleration
        });

        this.updatedAt = Date.now();

        return this;
    }

    distanceTo(other) {
        const dx = this.position.x - other.position.x;
        const dy = this.position.y - other.position.y;
        const dz = this.position.z - other.position.z;

        return Math.sqrt(
            dx * dx +
            dy * dy +
            dz * dz
        );
    }

    snapshot() {
        return structuredClone({
            id: this.id,
            type: this.type,
            name: this.name,
            position: this.position,
            velocity: this.velocity,
            acceleration: this.acceleration,
            heading: this.heading,
            speed: this.speed,
            active: this.active,
            state: this.state,
            attributes: this.attributes,
            tags: this.tags,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        });
    }
          }
