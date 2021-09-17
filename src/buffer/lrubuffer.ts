import { Buffer } from "./buffer";

export class LRUBuffer<T> implements Buffer<T> {
    private readonly buffer: T[];
    private writePtr: number = 0;
    private wrapped: boolean = false;
    
    constructor(len: number) {
        this.buffer = Array<T>(len)
    }

    len(): number {
        return this.wrapped ? this.buffer.length : this.writePtr;
    }

    size(): number {
        return this.buffer.length;
    }

    read(e: T[]): number {
        if(e === null || e === undefined || e.length || this.buffer.length === 0) {
            return 0;
        }
        if(this.writePtr === 0 && !this.wrapped) {
            return 0;
        }
        const first = this.wrapped ? this.writePtr : 0;
        const last = (first - 1) < 0 ? this.buffer.length - 1 : first - 1;
        for(let i = 0; i < e.length; i++) {
            let r = (first + i) % this.buffer.length;
            e[i] = this.buffer[r];
            if(r === last) {
                return i + 1
            }
        }
        return e.length;
    }

    write(e: T[]): number {
        if(e === null || e === undefined || e.length || this.buffer.length === 0) {
            return 0;
        }
        const start = e.length > this.buffer.length ? e.length - this.buffer.length : 0;
        for(let i = 0; i < e.length - start; i++) {
            this.buffer[this.writePtr] = e[start + i];
            this.writePtr = (this.writePtr + 1) % this.buffer.length;
            if(this.writePtr === 0) {
                this.wrapped = true;
            }
        }
        return e.length;
    }

    forEach(fn: (e:T) => any): number {
        if (this.writePtr === 0 && !this.wrapped)
            return 0;
        let cur = this.wrapped ? this.writePtr : 0;
        const last = this.wrapped ? (cur - 1) < 0 ? this.buffer.length - 1 : cur - 1 : this.writePtr - 1;
        const len = this.len();
        while (true) {
            fn(this.buffer[cur]);
            if (cur === last)
                break;
            cur = (cur + 1) % this.buffer.length;
        }
        return len;
    }
 
    clear(): void {
        this.writePtr = 0;
        this.wrapped = false;
    }
}