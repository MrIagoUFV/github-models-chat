# Chat com GitHub Models

Este é um projeto de exemplo que demonstra como criar um chat usando os modelos de IA do GitHub. O projeto utiliza Next.js 14, TypeScript, Tailwind CSS e Shadcn/UI para criar uma interface moderna e responsiva.

## 🚀 Demonstração

O projeto implementa:
- Chat em tempo real com streaming de respostas
- Interface moderna e responsiva
- Suporte a múltiplas mensagens
- Histórico de conversa
- Gerenciamento de estado com Zustand

## 📋 Pré-requisitos

- Node.js 18.17 ou superior
- Um token de acesso pessoal do GitHub (PAT)
- NPM ou Yarn

## 🔧 Instalação

1. Clone o repositório:
```bash
git clone <seu-repositorio>
cd <seu-repositorio>
```

2. Instale as dependências:
```bash
npm install
# ou
yarn
```

3. Crie um arquivo `.env.local` na raiz do projeto:
```env
NEXT_PUBLIC_GITHUB_TOKEN="seu-token-aqui"
NEXT_PUBLIC_GITHUB_ENDPOINT="https://models.inference.ai.azure.com"
NEXT_PUBLIC_GITHUB_MODEL="gpt-4o"
```

4. Execute o projeto:
```bash
npm run dev
# ou
yarn dev
```

## 🛠️ Como Implementar em Seu Projeto

### 1. Configuração do Store (Zustand)

Crie um arquivo `src/store/chat.ts`:
```typescript
import { create } from "zustand";

type Message = {
  role: "user" | "assistant" | "system";
  content: string;
};

type ChatStore = {
  messages: Message[];
  addMessage: (message: Message) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
};

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
}));
```

### 2. Configuração da API Route

Crie um arquivo `src/app/api/chat/route.ts`:
```typescript
import { OpenAI } from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({ 
  baseURL: process.env.NEXT_PUBLIC_GITHUB_ENDPOINT,
  apiKey: process.env.NEXT_PUBLIC_GITHUB_TOKEN,
});

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const stream = await openai.chat.completions.create({
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        ...messages
      ],
      model: process.env.NEXT_PUBLIC_GITHUB_MODEL || "gpt-4o",
      stream: true,
      temperature: 1.0,
      top_p: 1.0,
      max_tokens: 1000,
    });

    const encoder = new TextEncoder();
    const customStream = new ReadableStream({
      async start(controller) {
        for await (const part of stream) {
          const text = part.choices[0]?.delta?.content || '';
          if (text) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\n`));
          }
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      },
    });

    return new NextResponse(customStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
```

### 3. Implementação do Componente do Chat

Crie um arquivo `src/app/page.tsx`:
```typescript
"use client";

import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState, useRef, useEffect } from "react";
import { useChatStore } from "@/store/chat";

export default function ChatPage() {
  // ... (código do componente)
}
```

## 📦 Estrutura do Projeto

```
src/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts    # API Route para o chat
│   └── page.tsx            # Página principal do chat
├── components/
│   └── ui/                 # Componentes do Shadcn
├── store/
│   └── chat.ts            # Store do Zustand
└── lib/
    └── utils.ts           # Utilitários
```

## 🔑 Obtendo o Token do GitHub

1. Acesse as configurações do GitHub
2. Vá para "Developer settings" > "Personal access tokens" > "Tokens (classic)"
3. Gere um novo token (não precisa de permissões específicas)
4. Copie o token e adicione ao seu `.env.local`

## ⚙️ Configurações Avançadas

### Parâmetros do Modelo

No arquivo `route.ts`, você pode ajustar os parâmetros do modelo:

```typescript
const stream = await openai.chat.completions.create({
  // ...
  temperature: 1.0,    // Controla a criatividade (0-2)
  top_p: 1.0,         // Controla a diversidade
  max_tokens: 1000,   // Limite de tokens na resposta
});
```

### Mensagem do Sistema

Você pode personalizar a mensagem do sistema para definir o comportamento do assistente:

```typescript
messages: [
  { 
    role: "system", 
    content: "Você é um assistente especializado em..." 
  },
  ...messages
]
```

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie sua feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## ⚠️ Limitações

- O GitHub Models tem limites de uso gratuito
- Para uso em produção, considere usar o Azure AI
- O token é enviado para um serviço da Microsoft

## 📚 Links Úteis

- [Documentação do GitHub Models](https://platform.openai.com/docs/api-reference)
- [Next.js Documentation](https://nextjs.org/docs)
- [Shadcn/UI](https://ui.shadcn.com)
- [Zustand](https://github.com/pmndrs/zustand)
