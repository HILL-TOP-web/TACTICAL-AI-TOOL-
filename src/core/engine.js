/**
 * Simulation Engine
 *
 * Main coordinator for the controlled training simulation.
 */

const EventBus = require("./eventBus");
const StateManager = require("./stateManager");
const Confidence = require("./confidence");
const DecisionEngine = require("./decisionEngine");
const AuditLogger = require("./auditLogger");

class SimulationEngine {
  constructor(options = {}) {
    this.config =
      options.config || {};

    this.eventBus =
      options.eventBus ||
      new EventBus();

    this.stateManager =
      options.stateManager ||
      new StateManager(
        options.initialState || {}
      );

    this.confidence =
      options.confidence ||
      new Confidence();

    this.auditLogger =
      options.auditLogger ||
      new AuditLogger();

    this.decisionEngine =
      options.decisionEngine ||
      new DecisionEngine({
        confidence: this.confidence,
        eventBus: this.eventBus,
        auditLogger: this.auditLogger
      });

    this.running = false;
    this.startedAt = null;
    this.tickCount = 0;
    this.timer = null;

    this.bindEvents();
  }

  /**
   * Connect internal event handlers.
   */
  bindEvents() {
    this.eventBus.on(
      "decision:evaluated",
      (result) => {
        this.auditLogger.log(
          "decision:evaluated",
          {
            selected:
              result.selected?.id || null,

            score:
              result.selected?.score || 0
          }
        );
      }
    );
  }

  /**
   * Start the simulation.
   */
  start() {
    if (this.running) {
      return {
        started: false,
        reason: "Simulation is already running"
      };
    }

    if (
      this.config?.safety?.allowLiveOperations === true
    ) {
      throw new Error(
        "Live operations are not supported by this simulation engine."
      );
    }

    this.running = true;
    this.startedAt = new Date();
    this.tickCount = 0;

    this.stateManager.update({
      status: "running",
      startedAt:
        this.startedAt.toISOString(),
      tick: 0
    });

    this.auditLogger.log(
      "simulation_started",
      {
        scenario:
          this.config?.simulation?.scenarioName ||
          "unknown"
      }
    );

    this.eventBus.emit(
      "simulation:started",
      {
        timestamp:
          this.startedAt.toISOString()
      }
    );

    this.startTicker();

    return {
      started: true,
      startedAt:
        this.startedAt.toISOString()
    };
  }

  /**
   * Stop the simulation.
   */
  stop(reason = "manual") {
    if (!this.running) {
      return {
        stopped: false,
        reason: "Simulation is not running"
      };
    }

    this.running = false;

    this.stopTicker();

    this.stateManager.update({
      status: "stopped",
      stoppedAt:
        new Date().toISOString(),
      stopReason: reason
    });

    this.auditLogger.log(
      "simulation_stopped",
      {
        reason,
        ticks: this.tickCount
      }
    );

    this.eventBus.emit(
      "simulation:stopped",
      {
        reason,
        ticks: this.tickCount
      }
    );

    return {
      stopped: true,
      reason,
      ticks: this.tickCount
    };
  }

  /**
   * Execute one simulation tick.
   */
  tick() {
    if (!this.running) {
      return null;
    }

    this.tickCount += 1;

    const currentState =
      this.stateManager.getState();

    this.stateManager.set(
      "tick",
      this.tickCount
    );

    const tickData = {
      tick: this.tickCount,
      state: currentState,
      timestamp:
        new Date().toISOString()
    };

    this.eventBus.emit(
      "simulation:tick",
      tickData
    );

    this.auditLogger.log(
      "simulation_tick",
      {
        tick: this.tickCount
      }
    );

    this.checkDuration();

    return tickData;
  }

  /**
   * Start the simulation timer.
   */
  startTicker() {
    const tickRate =
      Number(
        this.config?.simulation?.tickRateMs
      ) || 1000;

    this.timer = setInterval(
      () => {
        try {
          this.tick();
        } catch (error) {
          this.auditLogger.error(
            error,
            {
              component:
                "simulation-engine"
            }
          );

          this.eventBus.emit(
            "simulation:error",
            {
              error
            }
          );
        }
      },
      tickRate
    );
  }

  /**
   * Stop the timer.
   */
  stopTicker() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /**
   * Automatically stop when maximum duration is reached.
   */
  checkDuration() {
    if (!this.startedAt) {
      return;
    }

    const maxDuration =
      Number(
        this.config?.simulation
          ?.maxDurationSeconds
      ) || 3600;

    const elapsed =
      (Date.now() -
        this.startedAt.getTime()) /
      1000;

    if (elapsed >= maxDuration) {
      this.stop("maximum-duration-reached");
    }
  }

  /**
   * Update simulation state.
   */
  updateState(updates) {
    const state =
      this.stateManager.update(
        updates
      );

    this.eventBus.emit(
      "state:updated",
      {
        state,
        timestamp:
          new Date().toISOString()
      }
    );

    return state;
  }

  /**
   * Evaluate simulated decisions.
   */
  evaluateDecisions(
    context,
    candidates
  ) {
    if (!this.running) {
      throw new Error(
        "Simulation must be running before evaluating decisions."
      );
    }

    return this.decisionEngine.evaluate(
      context,
      candidates
    );
  }

  /**
   * Get current simulation status.
   */
  getStatus() {
    return {
      running: this.running,

      tick:
        this.tickCount,

      startedAt:
        this.startedAt
          ? this.startedAt.toISOString()
          : null,

      state:
        this.stateManager.getState(),

      stateVersion:
        this.stateManager.getVersion()
    };
  }

  /**
   * Subscribe to an event.
   */
  on(eventName, handler) {
    return this.eventBus.on(
      eventName,
      handler
    );
  }

  /**
   * Shut down the engine.
   */
  destroy() {
    if (this.running) {
      this.stop("engine-destroyed");
    }

    this.stopTicker();

    this.eventBus.clear();
  }
}

module.exports = SimulationEngine;
