⚠️ **Warning: Beta Phase**

This module is currently in the beta phase. Use with caution and report any issues or feedback to help improve its stability and functionality.

📝 **Note**
In the future, I committed to continuous improvement, ensuring that this README file evolves to provide even better clarity and information.
**Working With**

- ExpressJS (✅ -> Tested by developer)
- HONOJS (NOT Tested, require tester)
- NestJS (NOT Tested, require tester)

# Chat Nexus Getting Started

## Available Features

- Private Chat
- Typing Indicator
- Authentication Support
- Group Chat

## Planned for Beta 2

- ~~Typing Indicator~~ (✅)
- ~~Group Chat~~ (✅)
- File Support (Not confirmed)

## Introduction

In the dynamic landscape of real-time communication, the "ChatNexus" NPM module stands out as a robust solution designed to seamlessly integrate scalable chat functionality into Node.js servers. Engineered for efficiency and reliability, ChatScale harnesses the power of Redis and Socket.IO to create a high-performance environment for chat applications

## Requirement

Redis server is required to use ChatNexus

### Installation

[Redis Installation](https://redis.io/docs/install/install-redis/)

## Installation

NPM

```
npm install chat-nexus
```

Yarn

```
yarn add chat-nexus
```

pnpm

```
pnpm add chat-nexus
```

## Usage

```
import _chatNexus from 'chat-nexus'
const ChatNexus = _chatNexus.default;
```

## Type of config file

```
  origin?: string;
  app?: any;
  redisPort?: number;
  redisHost?: string;
  redisOptions?: RedisOptions;
  redisPath?: string;
```

## Plugin with express

```
import express from 'express'
import _chatNexus from 'chat-nexus'
const ChatNexus = _chatNexus.default;
const app = express();
const config = {
  origin:'*',
  app:app
}
const chatServer = ChatNexus.chatNexusINIT(config);
app.get('/', (req, res)=> res.json('ok'))
chatServer.listen(5000, ()=>console.log('listening to 5000'))
```

## Enable Private Chat

```
chatServer.privateChat()
```

## Events for socket.io client to listen and emit

To emit a message

```
socket.emit('PRIVATE_CHAT', emitData);
```

To recive the event

```
 socket.on('PRIVATE_CHAT_RESPONSE', responseData=>{
})
```

## Type of emitData for private chat

```
reciverUsername:string,
message:string,
senderUsername:string
```

## Type of responseData for private chat

```
message:string,
senderUsername:string
```

## Enable Typing Indicator

```
chatServer.oneToOneTypingIndicator();
```

## Type of emitData for typing indicator

```
reciverUsername:string,
message:string,
isTyping:boolean
```

## Type of responseData for typing indicator

```
isTyping:boolean,
senderUsername:string
```

## Events for socket.io client to listen and emit typing indicator

To emit a message

```
socket.emit('ONE_TO_ONE_TYPING', emitData);
```

To recive the event

```
 socket.on('ONE_TO_ONE_TYPING_RESPONSE', responseData=>{
})
```

## Enable Authentication

```
chatServer.enableAuth(callback)
```

### Callback Type

The callback function takes two arguments
socket:Socket, next:(err?:ExtendedError | undefined)=>void

### Usage Example

```
 const accessToken = socket.handshake.headers.cookie?.split('=')[1];
    const username = socket.handshake.query.username;
    if(username !== 'a')
        return next(new Error('Invalid user'));
    next();
```

## Room Chat

```
chatServer.roomChat();
```

### Room Chat Events

#### Emits Events

- CREATE_ROOM
  - accepts: {roomname}
- JOIN_ROOM
  - accepts: {username, roomname}
- ROOM_MESSAGE
  - accepts: {roomname, message}

#### Listen Events

- CREATE_ROOM_RESPONSE
  - returns: {creator, roomId, roomname}
- JOIN_ROOM_ERROR
  - returns: 'Room does not exist'
- JOIN_ROOM_RESPONSE
  - returns:{roomId, roomname, username}
- ROOM_MESSAGE_RESPONSE
  - returns: {senderUsername, message}
- ROOM_MESSAGE_ERROR
  - returns: 'Room does not exit'
