'use strict';

const EventEmitter = require('events');

const Inventory = require('./inventory');
const Supplies = require('./supplies');
const Personnel = require('./personnel');
const Equipment = require('./equipment');
const ConsumptionModel = require('./consumptionModel');
const ResupplySimulator = require('./resupplySimulator');
const LogisticsPlanner = require('./logisticsPlanner');
const ResourceForecast = require('./resourceForecast');

class ResourceManager extends EventEmitter {
    constructor(options = {}) {
        super();

        this.options = {
            lowStockThreshold:
                options.lowStockThreshold ?? 0.25,

            criticalStockThreshold:
                options.criticalStockThreshold ?? 0.10,

            ...options
        };

        this.inventory = new Inventory(
            options.inventory
        );

        this.supplies = new Supplies(
            options.supplies
        );

        this.personnel = new Personnel(
            options.personnel
        );

        this.equipment = new Equipment(
            options.equipment
        );

        this.consumptionModel =
            new ConsumptionModel(
                options.consumptionModel
            );

        this.resupplySimulator =
            new ResupplySimulator(
                options.resupplySimulator
            );

        this.logisticsPlanner =
            new LogisticsPlanner(
                options.logisticsPlanner
            );

        this.resourceForecast =
            new ResourceForecast(
                options.resourceForecast
            );

        this.history = [];
    }

    addResource(resource) {
        return this.inventory.add(resource);
    }

    removeResource(id, quantity) {
        return this.inventory.remove(
            id,
            quantity
        );
    }

    consumeResource(id, quantity) {
        const result =
            this.inventory.consume(
                id,
                quantity
            );

        this.record('consumption', {
            id,
            quantity
        });

        this.emit(
            'resourceConsumed',
            result
        );

        return result;
    }

    addSupply(supply) {
        return this.supplies.add(supply);
    }

    addPersonnel(member) {
        return this.personnel.add(member);
    }

    addEquipment(item) {
        return this.equipment.add(item);
    }

    consumeForPeriod(context = {}) {
        const consumption =
            this.consumptionModel.calculate({
                supplies:
                    this.supplies.getAll(),

                personnel:
                    this.personnel.getActive(),

                equipment:
                    this.equipment.getOperational(),

                ...context
            });

        const results = [];

        for (const item of consumption) {
            const result =
                this.supplies.consume(
                    item.id,
                    item.quantity
                );

            results.push(result);
        }

        this.record(
            'period_consumption',
            results
        );

        return results;
    }

    forecast(options = {}) {
        return this.resourceForecast.forecast({
            inventory:
                this.inventory.getAll(),

            supplies:
                this.supplies.getAll(),

            personnel:
                this.personnel.getActive(),

            equipment:
                this.equipment.getAll(),

            ...options
        });
    }

    plan(options = {}) {
        return this.logisticsPlanner.plan({
            inventory:
                this.inventory.getAll(),

            supplies:
                this.supplies.getAll(),

            personnel:
                this.personnel.getAll(),

            equipment:
                this.equipment.getAll(),

            ...options
        });
    }

    simulateResupply(options = {}) {
        return this.resupplySimulator.simulate({
            inventory:
                this.inventory.getAll(),

            supplies:
                this.supplies.getAll(),

            ...options
        });
    }

    getStatus() {
        return {
            inventory:
                this.inventory.getAll(),

            supplies:
                this.supplies.getAll(),

            personnel:
                this.personnel.getAll(),

            equipment:
                this.equipment.getAll(),

            forecast:
                this.forecast(),

            timestamp: Date.now()
        };
    }

    record(type, data) {
        this.history.push({
            type,
            data,
            timestamp: Date.now()
        });

        if (this.history.length > 5000) {
            this.history.shift();
        }
    }

    getHistory() {
        return [...this.history];
    }

    reset() {
        this.inventory.reset();
        this.supplies.reset();
        this.personnel.reset();
        this.equipment.reset();

        this.history = [];

        this.emit('reset');
    }
}

module.exports = ResourceManager;
