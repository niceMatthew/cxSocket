>cxSocket一个还算聪明的微信websocket插件

背景： 最近小程序商城在做websocket优化请求性能。相对于微信流水式的监听函数调用，随着业务代码的复杂和迭代容易腐化。于是有了这次的封装。

当我们的时候需要考虑什么呢？笔者做出了以下单点考虑
1. 迷你事件管理系统，相比原生的将事件一股脑全部放到onClose链式事件中，这边支持了链式调用，并且可以反复订阅事件
2. 缓存策略机制，是的，即使是websocket，我们依旧加上了缓存。原因是Websocket存在断连的可能性以及风险，那么断连期间的通信空白，我们可以通过缓存进行弥补，不失为一种降级策略
3. 重连策略，检测到丢失时我们需要进行冲连，但是很有可能存在重连失败的请款，这时候重连的次数和间隔策略，在有限的资源里面更是需要权衡和平衡的。

### 事件类型
```
export enum CxSocketEvents {
    open = 'open',
    close = 'close',
    error = 'error',
    message = 'message',
    retry = 'retry'
}
```

### 安装

```
npm i cxsocket --save
```

### 使用

```
import { CxSocketCreator } from '@cxyx/foundation/request/dist'
```

通过 CxSocketCreator 构造函数创建websocket实例，参数参考如下，详细配置可以参考微信api
```
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
```
```
 const ws = new CxSocketCreator({
  url: 'ws://test123.hello.com:8000/zj/ws'
})
.onOpen((i, ev) => { console.log("opened") })
.onClose((i, ev) => { console.log("closed") })
.onError((i, ev) => { console.log("error") })
.onMessage((i, ev) => { console.log("message") })
.onRetry((i, ev) => { console.log("retry") })
.build()
```

#### 多次调用
```
const ws = new CxSocketCreator({
  url: 'ws://test123.hello.com:8000/zj/ws'
})
.onMessage((i, e) => { console.log("发送") })
.onMessage((i, e) => { i.send(e.data) })
.onMessage((i, e) => { console.log("信息收到") })
.build();
```

#### 事件移除
```
ws.removeEventListener(CxSocketEvents.open, targetListener);
```
#### 重连
当ws断连时，需要我们考虑重连的策略，这边考虑了两种重练策略
##### ConstantGapEmit
`ConstantBackoff` 会恒定的通过固定的时间来请求连接，直到连接陈工. 使用 `ConstantBackoff`来间隔 `1s`发送请求:
```typescript
const ws  = new CxSocketCreator('ws://test123.hello.com:8000/zj/ws'）
    .withBackoff(new ConstantBackoff(1000)) // 1000ms = 1s
    .build();
```

##### LinearGapEmit
相对于上一个，这个策略设定了开始时间，间隔时间以及终止时间。
如下例子，0s开始每隔1s尝试冲脸，到8s时自动放弃
```typescript
const ws  = new CxSocketCreator('ws://test123.hello.com:8000/zj/ws'）
    .withBackoff(new LinearBackoff(0, 1000, 8000))
    .build();
```

#### 断连数据缓存
断连时，我们会缓存客户端发往服务端的请求，一旦重连，就将缓存的数据，一股脑吐回去。对于缓存市场和数据数量正式下面提到的

##### LRUBuffer
字如其名，我们会缓存最新的n个数据，将n个之外超出的数据进行淘汰
```
const ws  = new CxSocketCreator('ws://test123.hello.com:8000/zj/ws'）
    .withBuffer(new LRUBuffer(1000))
    .build();
```

#### TimeBuffer
timeBuffer策略会缓存最近n秒的数据，超过n秒的数据将会被无情抛弃
```
const ws  = new CxSocketCreator('ws://test123.hello.com:8000/zj/ws'）
     .withBuffer(new TimeBuffer(5 * 60 * 1000))
    .build();
```


