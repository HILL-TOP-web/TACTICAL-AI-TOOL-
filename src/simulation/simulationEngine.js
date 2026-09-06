/**
 * simulationEngine.js
 *
 * Main simulation coordinator.
 *
 * Responsibilities:
 * - Manage simulation lifecycle
 * - Advance simulation time
 * - Process events
 * - Update entities
 * - Update environment
 * - Record replay data
 */

import { Clock } from "./clock.js";
import { WorldState } from "./worldState.js";
import { EventGenerator } from "./eventGenerator.js";
import { Randomization } from "./randomization.js";
import { Replay } from "./replay.js";

export class SimulationEngine {
    constructor(options = {}) {
        this.id = options.id || `sim-${Date.now()}`;

        this.config = {
            tickRate: options.tickRate || 1000,
            timeScale: options.timeScale || 1,
            autoGenerateEvents: options.autoGenerateEvents ?? true,
            recordReplay: options.recordReplay ?? true,
            maxTicks: options.maxTicks ?? Infinity
        };

        this.clock = new Clock({
            startTime: options.startTime || Date.now(),
            timeScale: this.config.timeScale
        });

        this.world = options.world || new WorldState({
            id: options.worldId || `${this.id}-world`
        });

        this.random = options.random || new Randomization(
            options.seed ?? Date.now()
        );

        this.eventGenerator = new EventGenerator({
            random: this.random
        });

        this.replay = this.config.recordReplay
            ? new Replay()
            : null;

        this.running = false;
        this.tickCount = 0;
        this.lastTickDuration = 0;

        this.listeners = new Map();
    }

    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }

        this.listeners.get(event).add(callback);

        return () => {
            this.listeners.get(event)?.delete(callback);
        };
    }

    emit(event, payload) {
        const callbacks = this.listeners.get(event);

        if (!callbacks) {
            return;
        }

        for (const callback of callbacks) {
            try {
                callback(payload);
            } catch (error) {
                console.error(`Simulation listener error [${event}]:`, error);
            }
        }
    }

    loadScenario(scenario) {
        if (!scenario) {
            throw new Error("Scenario is required");
        }

        this.world.loadScenario(scenario);

        if (scenario.startTime) {
            this.clock.setTime(scenario.startTime);
        }

        this.tickCount = 0;

        this.emit("scenarioLoaded", {
            scenario,
            world: this.world
        });

        return this.world;
    }

    start() {
        if (this.running) {
            return;
        }

        this.running = true;

        this.emit("started", {
            time: this.clock.now()
        });

        this._runLoop();
    }

    stop() {
        this.running = false;

        this.emit("stopped", {
            time: this.clock.now(),
            ticks: this.tickCount
        });
    }

    reset() {
        this.stop();

        this.tickCount = 0;
        this.clock.reset();
        this.world.reset();

        if (this.replay) {
            this.replay.clear();
        }

        this.emit("reset");
    }

    step(deltaMs = this.config.tickRate) {
        const start = Date.now();

        const previousTime = this.clock.now();

        this.clock.advance(deltaMs);

        const currentTime = this.clock.now();

        const context = {
            engine: this,
            world: this.world,
            previousTime,
            currentTime,
            deltaMs,
            tick: this.tickCount + 1,
            random: this.random
        };

        this._processEvents(context);
        this._updateEnvironment(context);
        this._updateEntities(context);

        this.world.update({
            deltaMs,
            time: currentTime
        });

        this.tickCount++;

        const snapshot = this.world.snapshot();

        if (this.replay) {
            this.replay.record({
                tick: this.tickCount,
                time: currentTime,
                deltaMs,
                state: snapshot
            });
        }

        this.lastTickDuration = Date.now() - start;

        this.emit("tick", {
            tick: this.tickCount,
            time: currentTime,
            deltaMs,
            state: snapshot
        });

        if (this.tickCount >= this.config.maxTicks) {
            this.stop();
        }

        return snapshot;
    }

    _processEvents(context) {
        const events = this.world.consumeEvents();

        for (const event of events) {
            this.world.applyEvent(event);

            this.emit("event", event);
        }

        if (this.config.autoGenerateEvents) {
            const generated = this.eventGenerator.generate(context);

            for (const event of generated) {
                this.world.queueEvent(event);
            }
        }
    }

    _updateEnvironment(context) {
        this.world.environment.update(context);
    }

    _updateEntities(context) {
        for (const entity of this.world.getEntities()) {
            if (!entity.active) {
                continue;
            }

            entity.update(context);
        }
    }

    async _runLoop() {
        while (this.running) {
            const start = Date.now();

            this.step(this.config.tickRate);

            const elapsed = Date.now() - start;
            const wait = Math.max(0, this.config.tickRate - elapsed);

            if (wait > 0) {
                await new Promise(resolve => setTimeout(resolve, wait));
            }
        }
    }

    getState() {
        return {
            id: this.id,
            running: this.running,
            tickCount: this.tickCount,
            time: this.clock.now(),
            world: this.world.snapshot()
        };
    }
          }
