/**
 * instructorDashboard.js
 *
 * Provides instructor-facing summaries and
 * exercise monitoring information.
 */

export class InstructorDashboard {
    constructor() {
        this.exercises = new Map();
    }

    registerExercise(exercise) {
        if (!exercise?.id) {
            throw new Error(
                "Exercise requires an id"
            );
        }

        this.exercises.set(
            exercise.id,
            {
                id: exercise.id,

                name:
                    exercise.name ||
                    exercise.id,

                status:
                    exercise.status ||
                    "created",

                participants: 0,

                alerts: [],

                updatedAt:
                    Date.now()
            }
        );

        return this.getExercise(
            exercise.id
        );
    }

    updateExercise(
        id,
        data = {}
    ) {
        const exercise =
            this.exercises.get(id);

        if (!exercise) {
            throw new Error(
                `Exercise not found: ${id}`
            );
        }

        Object.assign(
            exercise,
            data
        );

        exercise.updatedAt =
            Date.now();

        return this.getExercise(id);
    }

    addAlert(
        exerciseId,
        alert
    ) {
        const exercise =
            this.exercises.get(
                exerciseId
            );

        if (!exercise) {
            throw new Error(
                `Exercise not found: ${exerciseId}`
            );
        }

        exercise.alerts.push({
            id:
                alert.id ||
                `alert-${Date.now()}`,

            level:
                alert.level ||
                "info",

            message:
                alert.message ||
                "",

            timestamp:
                Date.now(),

            acknowledged:
                false
        });

        return this.getExercise(
            exerciseId
        );
    }

    acknowledgeAlert(
        exerciseId,
        alertId
    ) {
        const exercise =
            this.exercises.get(
                exerciseId
            );

        if (!exercise) {
            return false;
        }

        const alert =
            exercise.alerts.find(
                item =>
                    item.id === alertId
            );

        if (!alert) {
            return false;
        }

        alert.acknowledged =
            true;

        return true;
    }

    getExercise(id) {
        const exercise =
            this.exercises.get(id);

        return exercise
            ? structuredClone(exercise)
            : null;
    }

    getDashboard() {
        return {
            generatedAt:
                Date.now(),

            exercises:
                Array.from(
                    this.exercises.values()
                ).map(
                    exercise =>
                        structuredClone(
                            exercise
                        )
                )
        };
    }

    getActiveExercises() {
        return Array.from(
            this.exercises.values()
        )
            .filter(
                exercise =>
                    exercise.status ===
                    "running"
            )
            .map(
                exercise =>
                    structuredClone(
                        exercise
                    )
            );
    }
          }
