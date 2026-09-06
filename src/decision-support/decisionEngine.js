/**
 * decisionEngine.js
 *
 * Coordinates the decision-support pipeline.
 *
 * Pipeline:
 *   Context
 *      ↓
 *   Option generation
 *      ↓
 *   Risk assessment
 *      ↓
 *   Consequence modelling
 *      ↓
 *   Trade-off analysis
 *      ↓
 *   Confidence scoring
 *      ↓
 *   Recommendation
 *      ↓
 *   Human approval
 *
 * This module provides decision SUPPORT.
 * It does not execute decisions.
 */

import { OptionGenerator } from "./optionGenerator.js";
import { RiskAssessment } from "./riskAssessment.js";
import { ConsequenceModel } from "./consequenceModel.js";
import { TradeoffAnalysis } from "./tradeoffAnalysis.js";
import { Recommendation } from "./recommendation.js";
import { ConfidenceScore } from "./confidenceScore.js";
import { HumanApproval } from "./humanApproval.js";

export class DecisionEngine {
    constructor(options = {}) {
        this.optionGenerator =
            options.optionGenerator ||
            new OptionGenerator();

        this.riskAssessment =
            options.riskAssessment ||
            new RiskAssessment();

        this.consequenceModel =
            options.consequenceModel ||
            new ConsequenceModel();

        this.tradeoffAnalysis =
            options.tradeoffAnalysis ||
            new TradeoffAnalysis();

        this.confidenceScore =
            options.confidenceScore ||
            new ConfidenceScore();

        this.recommendation =
            options.recommendation ||
            new Recommendation();

        this.humanApproval =
            options.humanApproval ||
            new HumanApproval();

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

    emit(event, data) {
        const callbacks = this.listeners.get(event);

        if (!callbacks) {
            return;
        }

        for (const callback of callbacks) {
            callback(data);
        }
    }

    evaluate(context = {}) {
        if (!context || typeof context !== "object") {
            throw new Error("Decision context is required");
        }

        this.emit("started", { context });

        const options =
            this.optionGenerator.generate(context);

        const evaluated = options.map(option => {
            const risk =
                this.riskAssessment.evaluate(
                    option,
                    context
                );

            const consequences =
                this.consequenceModel.evaluate(
                    option,
                    context
                );

            const tradeoffs =
                this.tradeoffAnalysis.evaluate(
                    option,
                    {
                        context,
                        risk,
                        consequences
                    }
                );

            const confidence =
                this.confidenceScore.calculate({
                    option,
                    context,
                    risk,
                    consequences,
                    tradeoffs
                });

            return {
                ...option,
                risk,
                consequences,
                tradeoffs,
                confidence
            };
        });

        const recommendation =
            this.recommendation.generate(
                evaluated,
                context
            );

        const approval =
            this.humanApproval.createRequest(
                recommendation,
                context
            );

        const result = {
            timestamp: Date.now(),

            context,

            options: evaluated,

            recommendation,

            approval
        };

        this.emit("completed", result);

        return result;
    }

    compare(options, context = {}) {
        const evaluated = options.map(option => {
            const risk =
                this.riskAssessment.evaluate(
                    option,
                    context
                );

            const consequences =
                this.consequenceModel.evaluate(
                    option,
                    context
                );

            const tradeoffs =
                this.tradeoffAnalysis.evaluate(
                    option,
                    {
                        context,
                        risk,
                        consequences
                    }
                );

            const confidence =
                this.confidenceScore.calculate({
                    option,
                    context,
                    risk,
                    consequences,
                    tradeoffs
                });

            return {
                ...option,
                risk,
                consequences,
                tradeoffs,
                confidence
            };
        });

        return this.recommendation.rank(evaluated);
    }
          }
