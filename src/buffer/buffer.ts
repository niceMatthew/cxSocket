export interface Buffer<T> {
    len(): number;
    size():number;
    read(e:T[]): number;
    write(e: T[]): number;
    forEach(fn: (e: T) => any): number;
    clear(): void;
}