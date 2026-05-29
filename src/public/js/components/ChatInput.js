export class ChatInput {
    form;
    input;
    submitHandler;
    constructor(formId, inputId, onSubmit) {
        const formEl = document.getElementById(formId);
        const inputEl = document.getElementById(inputId);
        if (!formEl || !inputEl)
            throw new Error('Form elements not found');
        this.form = formEl;
        this.input = inputEl;
        this.submitHandler = onSubmit;
        this.form.addEventListener('submit', this.handleSubmit.bind(this));
    }
    handleSubmit(e) {
        e.preventDefault();
        const value = this.input.value.trim();
        if (value) {
            this.input.value = '';
            this.submitHandler(value);
        }
    }
    setDisabled(disabled) {
        this.input.disabled = disabled;
        const btn = this.form.querySelector('button');
        if (btn)
            btn.disabled = disabled;
    }
}
