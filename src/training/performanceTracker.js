/**
 * performanceTracker.js
 *
 * Tracks participant performance throughout
 * a training exercise.
 */

export class PerformanceTracker {
    constructor() {
        this.participants = new Map();
    }

    registerParticipant(id) {
        if (!id) {
            throw new Error(
                "Participant id is required"
            );
        }

        if (
            !this.participants.has(id)
        ) {
            this.participants.set(
                id,
                {
                    participantId: id,

                    startedAt:
                        Date.now(),

                    events: [],

                    metrics: {},

                    objectives: [],

                    observations: []
                }
            );
        }

        return this.get(id);
    }

    recordEvent(
        participantId,
        event
    ) {
        const participant =
            this.ensure(
                participantId
            );

        participant.events.push({
            ...structuredClone(event),

            timestamp:
                event.timestamp ||
                Date.now()
        });

        return participant;
    }

    recordMetric(
        participantId,
        name,
        value
    ) {
        const participant =
            this.ensure(
                participantId
            );

        if (
            !participant.metrics[name]
        ) {
            participant.metrics[name] =
                [];
        }

        participant.metrics[
            name
        ].push({
            value,

            timestamp:
                Date.now()
        });

        return participant;
    }

    recordObjective(
        participantId,
        result
    ) {
        const participant =
            this.ensure(
                participantId
            );

        participant.objectives.push(
            {
                ...structuredClone(result),

                timestamp:
                    Date.now()
            }
        );

        return participant;
    }

    addObservation(
        participantId,
        observation
    ) {
        const participant =
            this.ensure(
                participantId
            );

        participant.observations.push({
            ...structuredClone(
                observation
            ),

            timestamp:
                Date.now()
        });

        return participant;
    }

    calculateMetrics(
        participantId
    ) {
        const participant =
            this.ensure(
                participantId
            );

        const objectiveResults =
            participant.objectives;

        const completed =
            objectiveResults.filter(
                objective =>
                    objective.achieved
            ).length;

        const objectiveRate =
            objectiveResults.length
                ? completed /
                  objectiveResults.length
                : 0;

        return {
            participantId,

            objectiveCompletion:
                objectiveRate,

            eventCount:
                participant.events.length,

            observationCount:
                participant.observations.length
        };
    }

    get(id) {
        const participant =
            this.participants.get(id);

        return participant
            ? structuredClone(participant)
            : null;
    }

    getAll() {
        return Array.from(
            this.participants.values()
        ).map(
            participant =>
                structuredClone(
                    participant
                )
        );
    }

    ensure(id) {
        if (!this.participants.has(id)) {
            this.registerParticipant(id);
        }

        return this.participants.get(id);
    }

    reset() {
        this.participants.clear();
    }
          }
