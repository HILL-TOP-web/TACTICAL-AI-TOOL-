'use strict';

const militaryPersona = require('./militaryPersona');
const commandParser = require('./commandParser');
const intentClassifier = require('./intentClassifier');
const responseFormatter = require('./responseFormatter');
const briefingGenerator = require('./briefingGenerator');
const situationReport = require('./situationReport');
const statusReport = require('./statusReport');
const debriefGenerator = require('./debriefGenerator');
const clarificationEngine = require('./clarificationEngine');
const conversationMemory = require('./conversationMemory');
const terminology = require('./terminology');
const responseTemplates = require('./responseTemplates');

class ConversationEngine {
    constructor(options = {}) {
        this.persona = options.persona || militaryPersona;
        this.memory = options.memory || conversationMemory.createMemory();
        this.maxHistory = options.maxHistory || 50;
    }

    process(input, context = {}) {
        const text = typeof input === 'string'
            ? input.trim()
            : '';

        if (!text) {
            return responseFormatter.format(
                responseTemplates.error('No input was provided.')
            );
        }

        const parsedCommand = commandParser.parse(text);

        const intent = intentClassifier.classify(
            parsedCommand.text,
            context
        );

        const memoryContext = this.memory.getContext();

        const mergedContext = {
            ...context,
            memory: memoryContext,
            command: parsedCommand,
            intent
        };

        let response;

        switch (intent.name) {
            case 'briefing':
                response = briefingGenerator.generate(mergedContext);
                break;

            case 'situation_report':
                response = situationReport.generate(mergedContext);
                break;

            case 'status_report':
                response = statusReport.generate(mergedContext);
                break;

            case 'debrief':
                response = debriefGenerator.generate(mergedContext);
                break;

            case 'terminology':
                response = terminology.explain(
                    parsedCommand.text
                );
                break;

            case 'clarification':
                response = clarificationEngine.generate(
                    mergedContext
                );
                break;

            case 'greeting':
                response = {
                    title: 'TACTICAL AI',
                    message: this.persona.greeting(),
                    type: 'conversation'
                };
                break;

            case 'help':
                response = {
                    title: 'AVAILABLE COMMANDS',
                    message: responseTemplates.help(),
                    type: 'help'
                };
                break;

            default:
                response = this.persona.respond(
                    parsedCommand.text,
                    mergedContext
                );
        }

        this.memory.add({
            input: text,
            intent: intent.name,
            response
        });

        this.memory.trim(this.maxHistory);

        return responseFormatter.format(response);
    }

    resetMemory() {
        this.memory.clear();
    }

    getMemory() {
        return this.memory.getHistory();
    }
}

module.exports = ConversationEngine;
