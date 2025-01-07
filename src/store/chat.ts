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