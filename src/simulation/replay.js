/**
 * replay.js
 *
 * Records and replays simulation states.
 */

export class Replay {
    constructor(options = {}) {
        this.id =
            options.id ||
            `replay-${Date.now()}`;

        this.frames = [];

        this.metadata = {
            createdAt: Date.now(),
            ...options.metadata
        };
    }

    record(frame) {
        if (!frame) {
            throw new Error(
                "Replay frame is required"
            );
        }

        this.frames.push(
            structuredClone(frame)
        );

        return frame;
    }

    getFrame(index) {
        if (
            index < 0 ||
            index >= this.frames.length
        ) {
            return null;
        }

        return structuredClone(
            this.frames[index]
        );
    }

    getFrames() {
        return structuredClone(
            this.frames
        );
    }

    getFrameAtTick(tick) {
        const frame =
            this.frames.find(
                item => item.tick === tick
            );

        return frame
            ? structuredClone(frame)
            : null;
    }

    getFrameAtTime(time) {
        if (this.frames.length === 0) {
            return null;
        }

        let closest =
            this.frames[0];

        let closestDifference =
            Math.abs(
                closest.time - time
            );

        for (const frame of this.frames) {
            const difference =
                Math.abs(
                    frame.time - time
                );

            if (
                difference <
                closestDifference
            ) {
                closest = frame;
                closestDifference =
                    difference;
            }
        }

        return structuredClone(
            closest
        );
    }

    play(callback, options = {}) {
        if (
            typeof callback !== "function"
        ) {
            throw new Error(
                "Replay callback is required"
            );
        }

        const speed =
            options.speed || 1;

        let index = 0;

        const playNext = () => {
            if (
                index >=
                this.frames.length
            ) {
                options.onComplete?.();

                return;
            }

            const frame =
                this.frames[index++];

            callback(
                structuredClone(frame)
            );

            if (
                index >=
                this.frames.length
            ) {
                options.onComplete?.();

                return;
            }

            const next =
                this.frames[index];

            const delay =
                Math.max(
                    0,
                    (next.time - frame.time) /
                    speed
                );

            setTimeout(
                playNext,
                delay
            );
        };

        playNext();
    }

    export() {
        return {
            id: this.id,

            metadata: structuredClone(
                this.metadata
            ),

            frames: this.getFrames()
        };
    }

    import(data) {
        if (!data) {
            throw new Error(
                "Replay data is required"
            );
        }

        this.id =
            data.id || this.id;

        this.metadata =
            structuredClone(
                data.metadata || {}
            );

        this.frames =
            structuredClone(
                data.frames || []
            );

        return this;
    }

    clear() {
        this.frames = [];
    }

    get length() {
        return this.frames.length;
    }
}
