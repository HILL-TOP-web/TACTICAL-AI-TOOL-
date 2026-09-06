/**
 * exerciseEngine.js
 *
 * Main coordinator for a training exercise.
 *
 * Responsibilities:
 * - Start/stop exercises
 * - Manage exercise state
 * - Track participants
 * - Evaluate objectives
 * - Record events
 * - Produce exercise results
 */

export class ExerciseEngine {
    constructor(options = {}) {
        this.id =
            options.id ||
            `exercise-${Date.now()}`;

        this.status = "created";

        this.startTime = null;
        this.endTime = null;

        this.scenario = null;

        this.participants = new Map();

        this.events = [];

        this.objectives = [];

        this.performance = new Map();

        this.listeners = new Map();

        this.metadata = {
            ...options.metadata
        };
    }

    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(
                event,
                new Set()
            );
        }

        this.listeners
            .get(event)
            .add(callback);

        return () => {
            this.listeners
                .get(event)
                ?.delete(callback);
        };
    }

    emit(event, data) {
        const listeners =
            this.listeners.get(event);

        if (!listeners) {
            return;
        }

        for (const listener of listeners) {
            try {
                listener(data);
            } catch (error) {
                console.error(
                    `Training listener error [${event}]:`,
                    error
                );
            }
        }
    }

    loadScenario(scenario) {
        if (!scenario) {
            throw new Error(
                "Training scenario is required"
            );
        }

        this.scenario =
            structuredClone(scenario);

        this.objectives =
            Array.isArray(
                scenario.objectives
            )
                ? structuredClone(
                    scenario.objectives
                )
                : [];

        this.status = "ready";

        this.emit(
            "scenarioLoaded",
            this.scenario
        );

        return this.scenario;
    }

    addParticipant(participant) {
        if (!participant?.id) {
            throw new Error(
                "Participant requires an id"
            );
        }

        this.participants.set(
            participant.id,
            {
                ...structuredClone(
                    participant
                ),

                joinedAt: Date.now(),

                status: "active"
            }
        );

        this.performance.set(
            participant.id,
            {
                participantId:
                    participant.id,

                events: [],

                objectiveResults: [],

                metrics: {},

                score: 0
            }
        );

        return participant.id;
    }

    removeParticipant(id) {
        const participant =
            this.participants.get(id);

        if (!participant) {
            return false;
        }

        participant.status =
            "removed";

        return true;
    }

    start() {
        if (
            this.status !== "ready" &&
            this.status !== "paused"
        ) {
            throw new Error(
                `Cannot start exercise from status: ${this.status}`
            );
        }

        this.status = "running";

        if (!this.startTime) {
            this.startTime = Date.now();
        }

        this.emit("started", {
            id: this.id,
            startTime: this.startTime
        });

        return this.getState();
    }

    pause() {
        if (this.status !== "running") {
            return;
        }

        this.status = "paused";

        this.emit("paused", {
            time: Date.now()
        });
    }

    stop() {
        if (
            this.status !== "running" &&
            this.status !== "paused"
        ) {
            return;
        }

        this.status = "completed";

        this.endTime = Date.now();

        this.emit("completed", {
            id: this.id,
            endTime: this.endTime
        });

        return this.getState();
    }

    recordEvent(event) {
        if (!event) {
            throw new Error(
                "Training event is required"
            );
        }

        const record = {
            id:
                event.id ||
                `training-event-${Date.now()}`,

            timestamp:
                event.timestamp ||
                Date.now(),

            type:
                event.type ||
                "unknown",

            participantId:
                event.participantId ||
                null,

            objectiveId:
                event.objectiveId ||
                null,

            data:
                event.data || {}
        };

        this.events.push(record);

        if (record.participantId) {
            const performance =
                this.performance.get(
                    record.participantId
                );

            if (performance) {
                performance.events.push(
                    structuredClone(record)
                );
            }
        }

        this.emit(
            "event",
            record
        );

        return record;
    }

    recordObjectiveResult(
        participantId,
        result
    ) {
        if (
            !this.performance.has(
                participantId
            )
        ) {
            throw new Error(
                `Unknown participant: ${participantId}`
            );
        }

        const performance =
            this.performance.get(
                participantId
            );

        performance.objectiveResults.push(
            {
                ...structuredClone(result),
                timestamp: Date.now()
            }
        );

        return performance;
    }

    updateMetric(
        participantId,
        name,
        value
    ) {
        const performance =
            this.performance.get(
                participantId
            );

        if (!performance) {
            throw new Error(
                `Unknown participant: ${participantId}`
            );
        }

        performance.metrics[name] =
            value;

        return performance;
    }

    getState() {
        return {
            id: this.id,

            status: this.status,

            startTime: this.startTime,

            endTime: this.endTime,

            scenario:
                structuredClone(
                    this.scenario
                ),

            participants:
                Array.from(
                    this.participants.values()
                ).map(
                    participant =>
                        structuredClone(
                            participant
                        )
                ),

            objectives:
                structuredClone(
                    this.objectives
                ),

            performance:
                Array.from(
                    this.performance.values()
                ).map(
                    result =>
                        structuredClone(
                            result
                        )
                ),

            eventCount:
                this.events.length,

            metadata:
                structuredClone(
                    this.metadata
                )
        };
    }

    reset() {
        this.status = "created";

        this.startTime = null;
        this.endTime = null;

        this.scenario = null;

        this.participants.clear();

        this.events = [];

        this.objectives = [];

        this.performance.clear();
    }
       }
