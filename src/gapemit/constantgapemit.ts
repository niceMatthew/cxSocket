import { GapEmit } from "./gapemit";

export class ContantBackoff implements GapEmit {
    private readonly gapemit: number;
    constructor(gapemit: number) {
        this.gapemit = gapemit;
    }

    next(): number {
        return this.gapemit;
    }

    reset = () => {
        
    }
}