export class MessageComponent {
    message;
    constructor(message) {
        this.message = message;
    }
    render() {
        const div = document.createElement('div');
        div.className = `message ${this.message.role}`;
        const avatar = document.createElement('div');
        avatar.className = 'avatar';
        avatar.textContent = this.message.role === 'user' ? 'U' : 'A';
        const content = document.createElement('div');
        content.className = 'content';
        // Use marked.js for agent messages if available
        if (this.message.role === 'agent' && 'marked' in window) {
            // marked automatically parses links, including icon URLs via gfm
            content.innerHTML = window.marked.parse(this.message.content, {
                breaks: true,
                gfm: true
            });
            // Ensure all links open in a new tab
            const links = content.querySelectorAll('a');
            links.forEach(link => {
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                // If it's an image URL, optionally we could render it as an image
                if (link.href.match(/\.(jpeg|jpg|gif|png|webp)$/i) || link.href.includes('image/thumb')) {
                    link.innerHTML = `<img src="${link.href}" alt="Icon" style="max-width: 100px; max-height: 100px; border-radius: 20%; display: block; margin-top: 10px;" />`;
                }
            });
        }
        else {
            // Basic text splitting for user messages
            const textParts = this.message.content.split('\n');
            textParts.forEach(part => {
                if (part.trim()) {
                    const p = document.createElement('p');
                    p.textContent = part;
                    content.appendChild(p);
                }
            });
        }
        div.appendChild(avatar);
        div.appendChild(content);
        return div;
    }
}
