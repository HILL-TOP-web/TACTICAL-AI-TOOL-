/**
 * scoring.js
 *
 * Converts performance data into normalized
 * training scores.
 */

export class Scoring {
    constructor(options = {}) {
        this.weights = {
            objectives:
                options.objectivesWeight ??
                0.5,

            performance:
                options.performanceWeight ??
                0.3,

            consistency:
                options.consistencyWeight ??
                0.2
        };
    }

    scoreParticipant(data = {}) {
        const objectives =
            this.clamp(
                data.objectiveCompletion ??
                0
            );

        const performance =
            this.clamp(
                data.performance ??
                0
            );

        const consistency =
            this.clamp(
                data.consistency ??
                0
            );

        const score =
            objectives *
            this.weights.objectives +

            performance *
            this.weights.performance +

            consistency *
            this.weights.consistency;

        return {
            score:
                this.round(
                    score * 100
                ),

            normalized:
                score,

            grade:
                this.grade(score),

            components: {
                objectives,
                performance,
                consistency
            }
        };
    }

    scoreExercise(
        participants = []
    ) {
        return participants.map(
            participant => ({
                participantId:
                    participant.participantId,

                ...this.scoreParticipant(
                    participant
                )
            })
        );
    }

    grade(score) {
        if (score >= 0.9) {
            return "excellent";
        }

        if (score >= 0.8) {
            return "strong";
        }

        if (score >= 0.7) {
            return "satisfactory";
        }

        if (score >= 0.5) {
            return "needs-improvement";
        }

        return "unsatisfactory";
    }

    clamp(value) {
        return Math.max(
            0,
            Math.min(
                1,
                Number(value) || 0
            )
        );
    }

    round(value) {
        return Math.round(
            value * 100
        ) / 100;
    }
          }
