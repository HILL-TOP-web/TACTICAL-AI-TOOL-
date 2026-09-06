/**
 * humanApproval.js
 *
 * Human-in-the-loop approval mechanism.
 *
 * IMPORTANT:
 * This module never automatically executes a recommendation.
 * It creates an approval request and requires an explicit
 * human response.
 */

export class HumanApproval {
    constructor(options = {}) {
        this.requireApproval =
            options.requireApproval ?? true;

        this.requests = new Map();
    }

    createRequest(
        recommendation,
        context = {}
    ) {
        const id =
            `approval-${Date.now()}-${Math.random()
                .toString(36)
                .slice(2, 8)}`;

        const request = {
            id,

            status:
                this.requireApproval
                    ? "pending"
                    : "not-required",

            recommendation,

            contextSummary:
                this.summarizeContext(context),

            createdAt: Date.now(),

            reviewedAt: null,

            reviewer: null,

            comments: null
        };

        this.requests.set(
            id,
            request
        );

        return this.clone(request);
    }

    approve(id, reviewer, comments = "") {
        const request =
            this.getRequest(id);

        if (!request) {
            throw new Error(
                `Approval request not found: ${id}`
            );
        }

        if (
            request.status !== "pending"
        ) {
            throw new Error(
                "Approval request is no longer pending"
            );
        }

        request.status = "approved";

        request.reviewer =
            reviewer || "unknown";

        request.comments =
            comments;

        request.reviewedAt =
            Date.now();

        return this.clone(request);
    }

    reject(id, reviewer, comments = "") {
        const request =
            this.getRequest(id);

        if (!request) {
            throw new Error(
                `Approval request not found: ${id}`
            );
        }

        if (
            request.status !== "pending"
        ) {
            throw new Error(
                "Approval request is no longer pending"
            );
        }

        request.status = "rejected";

        request.reviewer =
            reviewer || "unknown";

        request.comments =
            comments;

        request.reviewedAt =
            Date.now();

        return this.clone(request);
    }

    requestMoreInformation(
        id,
        reviewer,
        comments = ""
    ) {
        const request =
            this.getRequest(id);

        if (!request) {
            throw new Error(
                `Approval request not found: ${id}`
            );
        }

        request.status =
            "more-information-required";

        request.reviewer =
            reviewer || "unknown";

        request.comments =
            comments;

        request.reviewedAt =
            Date.now();

        return this.clone(request);
    }

    getRequest(id) {
        return this.requests.get(id) || null;
    }

    listPending() {
        return Array.from(
            this.requests.values()
        )
            .filter(
                request =>
                    request.status === "pending"
            )
            .map(request =>
                this.clone(request)
            );
    }

    summarizeContext(context) {
        return {
            timestamp:
                context.timestamp ??
                Date.now(),

            dataQuality:
                context.dataQuality ??
                null,

            informationCompleteness:
                context.informationCompleteness ??
                null,

            uncertainty:
                context.uncertainty ??
                null
        };
    }

    clone(value) {
        return structuredClone(value);
    }
            }
