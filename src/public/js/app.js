import { ChatBox } from './components/ChatBox.js';
import { ChatInput } from './components/ChatInput.js';
import { ChatAPI } from './api.js';
class App {
    chatBox;
    chatInput;
    api;
    constructor() {
        this.api = new ChatAPI();
        this.chatBox = new ChatBox('chat-box');
        this.chatInput = new ChatInput('chat-form', 'url-input', this.handleUserMessage.bind(this));
    }
    async handleUserMessage(text) {
        const userMsg = {
            id: Date.now().toString(),
            role: 'user',
            content: text
        };
        this.chatBox.addMessage(userMsg);
        this.chatInput.setDisabled(true);
        this.chatBox.showLoading();
        const response = await this.api.sendMessage(text);
        this.chatBox.removeLoading();
        this.chatInput.setDisabled(false);
        const agentMsg = {
            id: Date.now().toString(),
            role: 'agent',
            content: response.error ? `Error: ${response.error}` : (response.reply || 'No response')
        };
        this.chatBox.addMessage(agentMsg);
    }
}
document.addEventListener('DOMContentLoaded', () => {
    new App();
});
