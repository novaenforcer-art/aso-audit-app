import { ChatResponse } from './types.js';

export class ChatAPI {
    private threadId: string;

    constructor() {
        this.threadId = 'thread-' + Math.random().toString(36).substring(2, 9);
    }

    async sendMessage(message: string): Promise<ChatResponse> {
        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message, threadId: this.threadId })
            });
            const data = await res.json();
            return data;
        } catch (error) {
            console.error('API Error:', error);
            return { error: 'Failed to connect to the server.' };
        }
    }
}