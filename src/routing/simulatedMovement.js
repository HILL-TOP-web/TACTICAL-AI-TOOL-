/**
 * simulatedMovement.js
 *
 * Simulates movement through a sequence of waypoints.
 *
 * This does not control any real vehicle, robot, drone,
 * weapon system, or external device.
 */

class SimulatedMovement {
  constructor(options = {}) {
    this.options = {
      speed: options.speed ?? 1,
      acceleration: options.acceleration ?? 0,
      deceleration: options.deceleration ?? 0,
      timestep: options.timestep ?? 1,
      ...options
    };
  }

  simulate(waypoints, options = {}) {
    if (
      !Array.isArray(waypoints) ||
      waypoints.length === 0
    ) {
      throw new Error(
        "Waypoints must be a non-empty array."
      );
    }

    const speed =
      options.speed ??
      this.options.speed;

    if (speed <= 0) {
      throw new Error(
        "Simulation speed must be greater than zero."
      );
    }

    const timestep =
      options.timestep ??
      this.options.timestep;

    let time = 0;
    let distance = 0;

    const timeline = [];

    timeline.push({
      time: 0,
      waypoint: waypoints[0],
      distance: 0
    });

    for (let i = 1; i < waypoints.length; i++) {
      const previous =
        waypoints[i - 1];

      const current =
        waypoints[i];

      const segmentDistance =
        Math.hypot(
          current.x - previous.x,
          current.y - previous.y
        );

      const duration =
        segmentDistance / speed;

      time += duration;
      distance += segmentDistance;

      timeline.push({
        time,
        waypoint: current,
        distance
      });
    }

    return {
      completed: true,
      totalTime: time,
      totalDistance: distance,
      averageSpeed:
        time > 0
          ? distance / time
          : 0,
      timeline
    };
  }

  interpolate(a, b, progress) {
    const p = Math.max(
      0,
      Math.min(1, progress)
    );

    return {
      x: a.x + (b.x - a.x) * p,
      y: a.y + (b.y - a.y) * p
    };
  }

  simulateRealtime(waypoints, callback, options = {}) {
    if (typeof callback !== "function") {
      throw new Error(
        "Callback must be a function."
      );
    }

    const speed =
      options.speed ??
      this.options.speed;

    const timestep =
      options.timestep ??
      this.options.timestep;

    let index = 0;

    const tick = () => {
      if (index >= waypoints.length) {
        callback({
          completed: true
        });

        return;
      }

      callback({
        completed: false,
        waypoint: waypoints[index],
        index
      });

      index++;

      setTimeout(
        tick,
        timestep * 1000
      );
    };

    tick();

    return {
      started: true,
      speed
    };
  }
}

module.exports = SimulatedMovement;
