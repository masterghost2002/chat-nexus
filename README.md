⚠️ **Warning: Beta Phase**

This module is currently in the beta phase. Use with caution and report any issues or feedback to help improve its stability and functionality.

# Chat Nexus Getting Started

## Available Features

- Private Chat

## Planned for Beta 2

- Typing Indicator
- Group Chat
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

## Plugin with express

```
import express from 'express'
import _chatNexus from 'chat-nexus'
const ChatNexus = _chatNexus.default;
const app = express();
const chatServer = ChatNexus.chatNexusINIT({origin:'*', app:app});
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

## Type of emitData

```
reciverUsername:string,
message:string,
senderUsername:string
```

## Type of responseData

```
message:string,
senderUsername:string
```
