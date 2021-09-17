import { Buffer } from './buffer';


type elementWithTimestamp<T> = {
    e: T,
    t: number,
    n?: elementWithTimestamp<T>
}

export class TimeBuffer<T> implements Buffer<T> {
    private readonly maxAge: number;
    private tail?: elementWithTimestamp<T>;
    private head?: elementWithTimestamp<T>;

    constructor(maxAge: number) {
        this.maxAge = maxAge;
    }

    size(): number {
        return Number.POSITIVE_INFINITY;
    }

    len(): number {
        this.forwardTail();
        let cur = this.tail;
        let i = 0;
        while(cur !== undefined) {
            i++;
            cur = cur.n;
        }
        return i;
    }

    read(e: T[]): number {
        this.forwardTail();
        if(e.length === 0) {
            return 0;
        }
        let cur = this.tail;
        let i = 0;
        while(cur !== undefined) {
            e[i++] = cur.e;
            if( i === e.length) {
                break;
            }
            cur = cur.n;
        }
        return i;
    }

    write(e: T[]): number {
        for(let i = 0; i < e.length; i++) {
            this.putElement(e[i])
        }
        return e.length;
    }

    private putElement(e: T) {
        const newElement = { e, t: Date.now(), n: undefined } as elementWithTimestamp<T>;
        if(this.tail === undefined) {
            this.tail = newElement;
        }
        if(this.head === undefined) {
            this.head = newElement
        } else {
            this.head.n = newElement;
            this.head = newElement
        }
    }

    forEach(fn: (e: T) => any): number {
        this.forwardTail();
        let cur = this.tail;
        let i = 0;
        while (cur !== undefined) {
            fn(cur.e);
            i++;
            cur = cur.n;
        }
        return i;
    }

    private forwardTail() {
        if(this.tail === undefined)
            return;
        const now = Date.now();
        while(now - this.tail.t > this.maxAge) {
            if(this.tail === this.head) {
                this.tail = undefined;
                this.head = undefined;
            } else {
                this.tail = this.tail?.n;
            }
            if(this.tail === undefined)
                break;
        }
    }

    clear() : void {

    }
}