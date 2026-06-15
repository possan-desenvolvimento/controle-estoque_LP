// Aguarda DOM carregar
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const btnLogin = document.getElementById('btnLogin');
    const togglePassword = document.getElementById('togglePassword');
    const rememberMe = document.getElementById('rememberMe');
    const trialLink = document.getElementById('showTrial');
    const trialModal = document.getElementById('trialModal');
    const modalClose = document.querySelector('.modal-close');
    const trialForm = document.getElementById('trialForm');
    const DASHBOARD_URL = getPageUrl('dashboard');

    // Mostrar/esconder senha
    if (togglePassword) {
        togglePassword.addEventListener('click', () => {
            const type = passwordInput.type === 'password' ? 'text' : 'password';
            passwordInput.type = type;
            togglePassword.textContent = type === 'password' ? '👁️' : '🔒';
        });
    }

    // Carregar email salvo
    if (localStorage.getItem('rememberedEmail')) {
        emailInput.value = localStorage.getItem('rememberedEmail');
        rememberMe.checked = true;
    }

    // Submit do login
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Limpar erros
        document.getElementById('emailError').textContent = '';
        document.getElementById('passwordError').textContent = '';

        let hasError = false;

        // Validação
        if (!emailInput.value || !emailInput.value.includes('@')) {
            document.getElementById('emailError').textContent = 'E-mail inválido';
            hasError = true;
        }

        if (!passwordInput.value || passwordInput.value.length < 3) {
            document.getElementById('passwordError').textContent = 'Senha deve ter pelo menos 3 caracteres';
            hasError = true;
        }

        if (hasError) return;

        // Mostrar loading
        const btnText = btnLogin.querySelector('.btn-text');
        const btnSpinner = btnLogin.querySelector('.btn-spinner');
        btnText.style.display = 'none';
        btnSpinner.style.display = 'inline';
        btnLogin.disabled = true;

        // Simular requisição (depois substitui pelo Spring Boot)
        // Simular requisição (depois substitui pelo Spring Boot)
        setTimeout(() => {
            // 🔐 CREDENCIAIS FIXAS
            const FAKE_EMAIL = 'admin@estoque.com';
            const FAKE_PASSWORD = '123456';

            if (emailInput.value === FAKE_EMAIL && passwordInput.value === FAKE_PASSWORD) {
                // Salvar email se "lembrar"
                if (rememberMe.checked) {
                    localStorage.setItem('rememberedEmail', emailInput.value);
                } else {
                    localStorage.removeItem('rememberedEmail');
                }

                // Salvar token fake (depois será JWT real)
                localStorage.setItem('authToken', 'fake-jwt-token');
                localStorage.setItem('userEmail', emailInput.value);
                localStorage.setItem('userName', 'Administrador');

                // Redirecionar para dashboard
                window.location.href = DASHBOARD_URL;
            } else {
                // Credenciais inválidas
                document.getElementById('emailError').textContent = 'E-mail ou senha incorretos';
                document.getElementById('passwordError').textContent = 'Use: admin@estoque.com / 123456';

                // Resetar botão
                btnText.style.display = 'inline';
                btnSpinner.style.display = 'none';
                btnLogin.disabled = false;
            }
        }, 1000);
    });

    // Modal Trial
    if (trialLink) {
        trialLink.addEventListener('click', (e) => {
            e.preventDefault();
            trialModal.style.display = 'flex';
        });
    }

    if (modalClose) {
        modalClose.addEventListener('click', () => {
            trialModal.style.display = 'none';
        });
    }

    // Fechar modal clicando fora
    window.addEventListener('click', (e) => {
        if (e.target === trialModal) {
            trialModal.style.display = 'none';
        }
    });

    // Submit do trial
    if (trialForm) {
        trialForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('trialName').value;
            const email = document.getElementById('trialEmail').value;

            // Salvar dados do trial
            localStorage.setItem('trialUser', JSON.stringify({ name, email }));

            alert(`🎉 Obrigado ${name}! Seu trial de 30 dias foi criado. Acesse seu e-mail para confirmar.`);
            trialModal.style.display = 'none';

            // Pré-preencher login
            emailInput.value = email;
        });
    }
});