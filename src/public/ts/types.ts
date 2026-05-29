export interface ChatMessage {
    id: string;
    role: 'user' | 'agent';
    content: string;
}

export interface ChatResponse {
    reply?: string;
    error?: string;
}