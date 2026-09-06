/**
 * lessonsLearned.js
 *
 * Stores reusable lessons derived from training
 * exercises and after-action reviews.
 */

export class LessonsLearned {
    constructor() {
        this.lessons = new Map();
    }

    add(lesson = {}) {
        if (!lesson.title) {
            throw new Error(
                "Lesson requires a title"
            );
        }

        const id =
            lesson.id ||
            `lesson-${Date.now()}-${Math.random()
                .toString(36)
                .slice(2, 7)}`;

        const record = {
            id,

            title:
                lesson.title,

            description:
                lesson.description ||
                "",

            category:
                lesson.category ||
                "general",

            evidence:
                Array.isArray(
                    lesson.evidence
                )
                    ? [...lesson.evidence]
                    : [],

            applicability:
                lesson.applicability ||
                "general",

            confidence:
                lesson.confidence ??
                0.5,

            createdAt:
                lesson.createdAt ||
                Date.now(),

            updatedAt:
                Date.now(),

            tags:
                Array.isArray(lesson.tags)
                    ? [...lesson.tags]
                    : []
        };

        this.lessons.set(
            id,
            record
        );

        return structuredClone(
            record
        );
    }

    update(id, changes = {}) {
        const lesson =
            this.lessons.get(id);

        if (!lesson) {
            throw new Error(
                `Lesson not found: ${id}`
            );
        }

        Object.assign(
            lesson,
            changes
        );

        lesson.updatedAt =
            Date.now();

        return structuredClone(
            lesson
        );
    }

    addEvidence(
        id,
        evidence
    ) {
        const lesson =
            this.lessons.get(id);

        if (!lesson) {
            throw new Error(
                `Lesson not found: ${id}`
            );
        }

        lesson.evidence.push(
            evidence
        );

        lesson.updatedAt =
            Date.now();

        return structuredClone(
            lesson
        );
    }

    search(query = {}) {
        const {
            category,
            tag,
            minimumConfidence
        } = query;

        return Array.from(
            this.lessons.values()
        )
            .filter(lesson => {
                if (
                    category &&
                    lesson.category !==
                    category
                ) {
                    return false;
                }

                if (
                    tag &&
                    !lesson.tags.includes(
                        tag
                    )
                ) {
                    return false;
                }

                if (
                    minimumConfidence !==
                    undefined &&
                    lesson.confidence <
                    minimumConfidence
                ) {
                    return false;
                }

                return true;
            })
            .map(
                lesson =>
                    structuredClone(
                        lesson
                    )
            );
    }

    get(id) {
        const lesson =
            this.lessons.get(id);

        return lesson
            ? structuredClone(lesson)
            : null;
    }

    getAll() {
        return Array.from(
            this.lessons.values()
        ).map(
            lesson =>
                structuredClone(
                    lesson
                )
        );
    }

    remove(id) {
        return this.lessons.delete(id);
    }

    clear() {
        this.lessons.clear();
    }

    export() {
        return {
            exportedAt:
                Date.now(),

            lessons:
                this.getAll()
        };
    }

    import(data) {
        if (
            !data ||
            !Array.isArray(
                data.lessons
            )
        ) {
            throw new Error(
                "Invalid lessons data"
            );
        }

        this.clear();

        for (
            const lesson
            of data.lessons
        ) {
            this.add(lesson);
        }

        return this;
    }
}
