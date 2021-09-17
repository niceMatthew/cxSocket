import { GapEmit } from "./gapemit";

export class LinearBackoff implements GapEmit {
    private readonly initial: number;
    private readonly increment: number;
    private readonly maximum?: number;
    private current: number;

    constructor(initial: number, increment:number,maximum?: number) {
        this.initial = initial;
        this.increment = increment;
        this.maximum = maximum;
        this.current = this.initial;
    }

    next() {
        const gapemit = this.current;
        const next = this.current + this.increment;
        if(this.maximum === undefined) {
            this.current = next;
        }
        else if(next <= this.maximum) {
            this.current = next;
        }
        return gapemit
    }

    reset() {
        this.current = this.initial;
    }
}