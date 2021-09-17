import {GapEmit} from "./gapemit/gapemit";
import {Buffer} from "./buffer/buffer";



type IAnyObject = Record<string, any>

export interface ConnectParam {
    url: string,
    header?: IAnyObject,
    protocols?: string[],
    tcpNoDelay?: boolean,
    perMessageDeflate?: boolean,
    timeout?: number,
    success?: () => {},
    fail?: () => {},
    complete?: () => {}
}
// /** 接口调用失败的回调函数 */



export enum CxSocketEvents {
    open = 'open',
    close = 'close',
    error = 'error',
    message = 'message',
    retry = 'retry'
}


type eventListener<K extends CxSocketEvents> = {
    readonly listener: (instance: unknown, ev: CxSocketEventsMap[K]) => any;
    readonly options?: boolean | EventListenerOptions;
}

type WebsocketEventListeners = {
    open: eventListener<CxSocketEvents.open>[];
    close: eventListener<CxSocketEvents.close>[];
    error: eventListener<CxSocketEvents.error>[];
    message: eventListener<CxSocketEvents.message>[];
    retry: eventListener<CxSocketEvents.retry>[];
}


export interface RetryEventDetails {
    readonly retries: number;
    readonly gapemit: number
}

interface CxSocketEventsMap {
    close: CloseEvent;
    error: Event;
    message: MessageEvent;
    open: Event;
    retry: CustomEvent<RetryEventDetails>
}


interface CloseParam {
    code?: number,
    reason?: string,
    success?: () => {},
    fail?: () => {},
    complete: () => {}
}

type CxSocketBuffer = Buffer<string | ArrayBuffer>;


export class cxSocket {
    private readonly connectParam: ConnectParam;
    private retries: number = 0;
    private readonly buffer?: CxSocketBuffer;
    private readonly gapemit?: GapEmit;

    private wxsocket?: any;
    private closedByUser: boolean = false;
    private readonly eventListeners: WebsocketEventListeners = {open: [], close: [], error: [], message: [], retry: []};

    constructor(rawParam: ConnectParam, buffer?: CxSocketBuffer, gapemit?: GapEmit) {
        this.connectParam = rawParam;
        this.buffer = buffer;
        this.gapemit = gapemit;
        this.startConnect();
    }

    private startConnect(): void {
        this.wxsocket = wx.connectSocket(this.connectParam)
    }

    public send(data: string | ArrayBuffer) {
        if(this.closedByUser) 
            return;
        if(this.wxsocket === undefined) 
            this.buffer?.write([data])
        else 
            this.wxsocket.send(data)
    }

    public close( data: CloseParam): void {
        this.closedByUser = true;
        this.wxsocket?.close({data});
    }

    public addEventListener<T extends CxSocketEvents>(
        type: T,
        listener: (instance: cxSocket, e: CxSocketEventsMap[T]) => any,
        options?: boolean | EventListenerOptions
    ):void {
        const eventListener = { listener, options } as eventListener<T>;
        const eventListeners = this.eventListeners[type] as eventListener<T>[];
        eventListeners.push(eventListener)
    }

    public removeEventListener<T extends CxSocketEvents>(
        type: T,
        listener: (instance: cxSocket, e: CxSocketEventsMap[T]) =>  any,
        options?: boolean | EventListenerOptions) : void {
            (this.eventListeners[type] as eventListener<T>[]) = 
                (this.eventListeners[type] as eventListener<T>[])
                    .filter(k => {
                        return k.listener !== listener && (k.options === undefined || k.options !== options)
                    })
    }
    

    private dispatchEvent<T extends CxSocketEvents>(type: T, e: CxSocketEventsMap[T]) {
        const listeners = this.eventListeners[type] as eventListener<T>[];
        const onceListeners = [] as eventListener<T>[];
        listeners.forEach(k => {
            k.listener(this, e);
            if(k.options !== undefined && (k.options as AddEventListenerOptions).once) {
                onceListeners.push(k)
            }
        })
        onceListeners.forEach(k => this.removeEventListener(type, k.listener, k.options))
    }

    private handleEvent<T extends CxSocketEvents>(type: T, e: CxSocketEventsMap[T]) {
        switch(type) {
            case CxSocketEvents.close:
                if(!this.closedByUser)
                    this.reconnect();
                break;
            case CxSocketEvents.open:
                this.retries = 0;
                this.gapemit?.reset();
                this.buffer?.forEach(this.send.bind(this)); // send all buffered messages
                this.buffer?.clear();
                break;          
        }
        this.dispatchEvent<T>(type, e)
    }

    private handleOpenEvent = (e: any) => this.handleEvent(CxSocketEvents.open, e);

    private handleCloseEvent = (e: any) => this.handleEvent(CxSocketEvents.close, e);

    private handleErrorEvent = (e: any) => this.handleEvent(CxSocketEvents.error, e);

    private handleMessageEvent = (e: any) => this.handleEvent(CxSocketEvents.message, e)

    private tryConnect(): void {
        if(this.wxsocket !== undefined) {
            this.wxsocket.close()
        }
        this.wxsocket = wx.connectSocket(this.connectParam)
        this.wxsocket.onOpen(this.handleOpenEvent)
        this.wxsocket.onError(this.handleErrorEvent)
        this.wxsocket.onClose(this.handleCloseEvent)
        this.wxsocket.onMessage(this.handleMessageEvent)
        this.wxsocket.close()
    }

    private reconnect() {
        if(this.gapemit === undefined) {
            return 
        }
        const gapemit = this.gapemit.next();
        setTimeout(() => {
            this.dispatchEvent(CxSocketEvents.retry, new CustomEvent<RetryEventDetails>(CxSocketEvents.retry,
                {
                    detail: {
                        retries: ++this.retries,
                        gapemit: gapemit
                    }
                })
            );
            this.tryConnect()
        }, gapemit)
    }
}