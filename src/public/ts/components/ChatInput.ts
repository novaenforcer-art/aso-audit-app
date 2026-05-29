export class ChatInput {
    private form: HTMLFormElement;
    private input: HTMLInputElement;
    private submitHandler: (message: string) => void;

    constructor(formId: string, inputId: string, onSubmit: (message: string) => void) {
        const formEl = document.getElementById(formId) as HTMLFormElement;
        const inputEl = document.getElementById(inputId) as HTMLInputElement;

        if (!formEl || !inputEl) throw new Error('Form elements not found');

        this.form = formEl;
        this.input = inputEl;
        this.submitHandler = onSubmit;

        this.form.addEventListener('submit', this.handleSubmit.bind(this));
    }

    private handleSubmit(e: Event) {
        e.preventDefault();
        const value = this.input.value.trim();
        if (value) {
            this.input.value = '';
            this.submitHandler(value);
        }
    }

    setDisabled(disabled: boolean) {
        this.input.disabled = disabled;
        const btn = this.form.querySelector('button');
        if (btn) btn.disabled = disabled;
    }
}