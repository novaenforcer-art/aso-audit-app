export class ChatAPI {
    threadId;
    constructor() {
        this.threadId = 'thread-' + Math.random().toString(36).substring(2, 9);
    }
    async sendMessage(message) {
        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message, threadId: this.threadId })
            });
            const data = await res.json();
            return data;
        }
        catch (error) {
            console.error('API Error:', error);
            return { error: 'Failed to connect to the server.' };
        }
    }
}
