import { GapEmit } from "./gapemit/gapemit";
import {Buffer} from "./buffer/buffer";
import { RetryEventDetails, cxSocket, CxSocketEvents, ConnectParam  } from "./socket";

export class CxSocketCreator {
    private ws: cxSocket | null = null;
    private connectParam: ConnectParam;
    private gapemit?: GapEmit;
    private buffer?: Buffer<string | ArrayBuffer>;
    private onOpenListeners: ({
        listener: (instance: cxSocket, ev: Event) => any,
        options?: boolean | EventListenerOptions
    })[] = [];
    private onCloseListeners: ({
        listener: (instance: cxSocket, ev: CloseEvent) => any,
        options?: boolean | EventListenerOptions
    })[] = [];
    private onErrorListeners: ({
        listener: (instance: cxSocket, ev: Event) => any,
        options?: boolean | EventListenerOptions
    })[] = [];
    private onMessageListeners: ({
        listener: (instance: cxSocket, ev: MessageEvent) => any,
        options?: boolean | EventListenerOptions
    })[] = [];
    private onRetryListeners: ({
        listener: (instance: cxSocket, ev: CustomEvent<RetryEventDetails>) => any,
        options?: boolean | EventListenerOptions
    })[] = [];

    constructor(connectParam: ConnectParam) {
        this.connectParam = connectParam;
    }

    public withgapemit(gapemit: GapEmit): CxSocketCreator {
        this.gapemit = gapemit;
        return this;
    }

    public withBuffer(buffer: Buffer<any>): CxSocketCreator {
        this.buffer = buffer;
        return this;
    }

    public onOpen(listener: (instance: cxSocket, ev: Event) => any,
                  options?: boolean | EventListenerOptions): CxSocketCreator {
        this.onOpenListeners.push({listener, options});
        return this;
    }

    public onClose(listener: (instance: cxSocket, ev: CloseEvent) => any,
                   options?: boolean | EventListenerOptions): CxSocketCreator {
        this.onCloseListeners.push({listener, options});
        return this;
    }

    public onError(listener: (instance: cxSocket, ev: Event) => any,
                   options?: boolean | EventListenerOptions): CxSocketCreator {
        this.onErrorListeners.push({listener, options});
        return this;
    }

    public onMessage(listener: (instance: cxSocket, ev: MessageEvent) => any,
                     options?: boolean | EventListenerOptions): CxSocketCreator {
        this.onMessageListeners.push({listener, options});
        return this;
    }

    public onRetry(listener: (instance: cxSocket, ev: CustomEvent<RetryEventDetails>) => any,
                   options?: boolean | EventListenerOptions): CxSocketCreator {
        this.onRetryListeners.push({listener, options});
        return this;
    }

    /**
     * Multiple calls to build() will always return the same websocket-instance.
     */
    public build(): cxSocket {
        if (this.ws !== null)
            return this.ws;
        this.ws = new cxSocket( this.connectParam , this.buffer, this.gapemit);
        this.onOpenListeners.forEach(h => this.ws?.addEventListener(CxSocketEvents.open, h.listener, h.options));
        this.onCloseListeners.forEach(h => this.ws?.addEventListener(CxSocketEvents.close, h.listener, h.options));
        this.onErrorListeners.forEach(h => this.ws?.addEventListener(CxSocketEvents.error, h.listener, h.options));
        this.onMessageListeners.forEach(h => this.ws?.addEventListener(CxSocketEvents.message, h.listener, h.options));
        this.onRetryListeners.forEach(h => this.ws?.addEventListener(CxSocketEvents.retry, h.listener, h.options));
        return this.ws;
    }
}