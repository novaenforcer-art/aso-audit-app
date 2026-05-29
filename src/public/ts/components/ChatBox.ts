import { ChatMessage } from '../types.js';
import { MessageComponent } from './Message.js';
import { LoadingUI } from './LoadingUI.js';

export class ChatBox {
    private container: HTMLElement;
    private loadingComponent: LoadingUI | null = null;

    constructor(containerId: string) {
        const el = document.getElementById(containerId);
        if (!el) throw new Error(`Container ${containerId} not found`);
        this.container = el;
    }

    addMessage(message: ChatMessage) {
        this.removeLoading();
        const msgComp = new MessageComponent(message);
        this.container.appendChild(msgComp.render());
        this.scrollToBottom();
    }

    showLoading() {
        if (!this.loadingComponent) {
            this.loadingComponent = new LoadingUI();
            this.container.appendChild(this.loadingComponent.render());
            this.scrollToBottom();
        }
    }

    removeLoading() {
        if (this.loadingComponent) {
            this.loadingComponent.render().remove();
            this.loadingComponent = null;
        }
    }

    private scrollToBottom() {
        this.container.scrollTop = this.container.scrollHeight;
    }
}