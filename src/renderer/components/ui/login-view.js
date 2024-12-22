class LoginView extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    width: 100%;
                    height: 100%;
                }
                .login-container {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    background-color: var(--background-color, #f5f5f5);
                }
                .login-box {
                    background: var(--box-background, white);
                    padding: 2rem;
                    border-radius: 8px;
                    box-shadow: var(--box-shadow, 0 2px 10px rgba(0, 0, 0, 0.1));
                    width: 400px;
                }
            </style>
            <div class="login-container">
                <div class="login-box">
                    <slot></slot>
                </div>
            </div>
        `;
    }
}

customElements.define('login-view', LoginView);
