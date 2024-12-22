class MsButton extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: inline-block;
                }
                button {
                    background: var(--ms-color, #0078d4);
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 4px;
                    font-size: 16px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                button:hover {
                    background: var(--ms-color-hover, #006cbd);
                }
                img {
                    width: 24px;
                    height: 24px;
                }
            </style>
            <button>
                <img src="${this.getAttribute('icon')}" alt="icon">
                <slot></slot>
            </button>
        `;
    }
}

customElements.define('ms-button', MsButton);
