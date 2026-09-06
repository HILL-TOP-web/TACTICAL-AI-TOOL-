/**
 * afterActionReview.js
 *
 * Creates structured after-action reviews
 * from completed training exercises.
 */

export class AfterActionReview {
    constructor() {
        this.reviews = new Map();
    }

    create(exercise = {}) {
        if (!exercise.id) {
            throw new Error(
                "Exercise id is required"
            );
        }

        const review = {
            id:
                `aar-${Date.now()}`,

            exerciseId:
                exercise.id,

            createdAt:
                Date.now(),

            summary:
                this.createSummary(
                    exercise
                ),

            strengths: [],

            weaknesses: [],

            observations: [],

            objectives:
                exercise.objectives ||
                [],

            recommendations: [],

            participantResults:
                exercise.performance ||
                []
        };

        this.reviews.set(
            review.id,
            review
        );

        return structuredClone(
            review
        );
    }

    createSummary(exercise) {
        const participants =
            exercise.performance ||
            [];

        return {
            participantCount:
                participants.length,

            eventCount:
                exercise.eventCount ||
                0,

            status:
                exercise.status ||
                "unknown",

            completedObjectives:
                this.countCompletedObjectives(
                    participants
                )
        };
    }

    countCompletedObjectives(
        participants
    ) {
        let completed = 0;

        for (const participant of participants) {
            for (
                const objective
                of participant.objectiveResults ||
                participant.objectives ||
                []
            ) {
                if (
                    objective.achieved
                ) {
                    completed++;
                }
            }
        }

        return completed;
    }

    addStrength(
        reviewId,
        strength
    ) {
        const review =
            this.get(reviewId);

        if (!review) {
            throw new Error(
                "Review not found"
            );
        }

        review.strengths.push(
            strength
        );

        return this.save(review);
    }

    addWeakness(
        reviewId,
        weakness
    ) {
        const review =
            this.get(reviewId);

        if (!review) {
            throw new Error(
                "Review not found"
            );
        }

        review.weaknesses.push(
            weakness
        );

        return this.save(review);
    }

    addObservation(
        reviewId,
        observation
    ) {
        const review =
            this.get(reviewId);

        if (!review) {
            throw new Error(
                "Review not found"
            );
        }

        review.observations.push(
            observation
        );

        return this.save(review);
    }

    addRecommendation(
        reviewId,
        recommendation
    ) {
        const review =
            this.get(reviewId);

        if (!review) {
            throw new Error(
                "Review not found"
            );
        }

        review.recommendations.push(
            recommendation
        );

        return this.save(review);
    }

    get(id) {
        const review =
            this.reviews.get(id);

        return review
            ? structuredClone(review)
            : null;
    }

    save(review) {
        this.reviews.set(
            review.id,
            review
        );

        return structuredClone(
            review
        );
    }
}
