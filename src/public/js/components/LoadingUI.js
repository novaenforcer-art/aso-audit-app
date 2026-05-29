export class LoadingUI {
    element;
    constructor() {
        this.element = document.createElement('div');
        this.element.className = 'message agent loading-indicator';
        const avatar = document.createElement('div');
        avatar.className = 'avatar';
        avatar.textContent = 'A';
        const content = document.createElement('div');
        content.className = 'content dots-container';
        for (let i = 0; i < 3; i++) {
            const dot = document.createElement('div');
            dot.className = 'dot';
            content.appendChild(dot);
        }
        this.element.appendChild(avatar);
        this.element.appendChild(content);
    }
    render() {
        return this.element;
    }
}
