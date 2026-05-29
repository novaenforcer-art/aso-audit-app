import { MessageComponent } from './Message.js';
import { LoadingUI } from './LoadingUI.js';
export class ChatBox {
    container;
    loadingComponent = null;
    constructor(containerId) {
        const el = document.getElementById(containerId);
        if (!el)
            throw new Error(`Container ${containerId} not found`);
        this.container = el;
    }
    addMessage(message) {
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
    scrollToBottom() {
        this.container.scrollTop = this.container.scrollHeight;
    }
}
