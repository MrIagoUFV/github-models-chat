"use client";

import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState, useRef, useEffect } from "react";
import { useChatStore } from "@/store/chat";

// Componente Principal
export default function ChatPage() {
  const { messages, addMessage, isLoading, setIsLoading } = useChatStore();
  const [input, setInput] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [streamingMessage, setStreamingMessage] = useState("");

  // Scroll para o final quando novas mensagens chegarem
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages, streamingMessage]);

  const handleSubmit = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { role: "user" as const, content: input };
    addMessage(userMessage);
    setInput("");
    setIsLoading(true);
    setStreamingMessage("");

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
        }),
      });

      if (!response.ok) throw new Error('Falha na requisição');
      
      const reader = response.body?.getReader();
      if (!reader) throw new Error('Stream não disponível');

      const decoder = new TextDecoder();
      let fullMessage = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(5).trim();
            
            // Ignora linhas vazias e [DONE]
            if (!data || data === '[DONE]') continue;
            
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content || "";
              if (content) {
                fullMessage += content;
                setStreamingMessage(fullMessage);
              }
            } catch (e) {
              console.error('Error parsing chunk:', e);
            }
          }
        }
      }

      // Adiciona a mensagem completa ao final do streaming
      if (fullMessage) {
        addMessage({ role: "assistant", content: fullMessage });
      }

    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
      setStreamingMessage("");
    }
  };

  return (
    <div className="container mx-auto max-w-4xl h-screen py-8 flex flex-col gap-4">
      <Card className="flex-1">
        <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
          {messages.map((message, i) => (
            <div key={i} className="flex gap-3 mb-4">
              <Avatar>
                <AvatarFallback>
                  {message.role === "user" ? "U" : "AI"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">
                  {message.role === "user" ? "Você" : "Assistente"}
                </p>
                <p className="mt-1 whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}
          {streamingMessage && (
            <div className="flex gap-3 mb-4">
              <Avatar>
                <AvatarFallback>AI</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Assistente</p>
                <p className="mt-1 whitespace-pre-wrap">{streamingMessage}</p>
              </div>
            </div>
          )}
          {isLoading && !streamingMessage && (
            <div className="flex gap-3 mb-4">
              <Avatar>
                <AvatarFallback>AI</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Assistente</p>
                <p className="mt-1">Digitando...</p>
              </div>
            </div>
          )}
        </ScrollArea>
      </Card>

      <div className="flex gap-2">
        <Textarea
          placeholder="Digite sua mensagem..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          className="min-h-[60px]"
        />
        <Button 
          onClick={handleSubmit}
          disabled={isLoading || !input.trim()}
        >
          Enviar
        </Button>
      </div>
    </div>
  );
}
