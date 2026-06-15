// ============================================
// GLOBAL.JS - Funções compartilhadas entre todas as telas
// ============================================

// URLs das páginas (para facilitar manutenção)
const PAGES = {
    login: 'login.html',
    dashboard: 'dashboard.html',
    clientes: 'clientes.html',
    estoque: 'estoque.html',
    financeiro: 'financeiro.html',
    vendas: 'vendas.html'
};

function getPageUrl(pageKey) {
    if (!(pageKey in PAGES)) return '#';
    const inPagesDir = window.location.pathname.includes('/pages/');
    if (pageKey === 'login') {
        return inPagesDir ? '../login.html' : 'login.html';
    }

    return inPagesDir ? PAGES[pageKey] : `pages/${PAGES[pageKey]}`;
}

// ========== AUTENTICAÇÃO ==========
function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    window.location.href = getPageUrl('login');
}

function getUserEmail() {
    return localStorage.getItem('userEmail') || 'usuario@estoque.com';
}

function getUserName() {
    return localStorage.getItem('userName') || 'Usuário';
}

function isAuthenticated() {
    const token = localStorage.getItem('authToken');
    if (!token) {
        window.location.href = getPageUrl('login');
        return false;
    }
    return true;
}

// ========== UTILITÁRIOS ==========
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

function formatDate(date) {
    const d = new Date(date);
    return d.toLocaleDateString('pt-BR');
}

function formatDateTime(date) {
    const d = new Date(date);
    return d.toLocaleString('pt-BR');
}

function maskPhone(phone) {
    return phone.replace(/\D/g,'')
        .replace(/^(\d{2})(\d)/g,'($1) $2')
        .replace(/(\d{5})(\d)/,'$1-$2')
        .substring(0,15);
}

// Gerar ID único
function generateId() {
    return Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

// ========== MENU MOBILE (função global) ==========
function setupMobileMenu() {
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    
    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', () => {
            sidebar.classList.toggle('open');
            if (overlay) overlay.classList.toggle('active');
        });
    }
    
    if (overlay) {
        overlay.addEventListener('click', () => {
            sidebar.classList.remove('open');
            overlay.classList.remove('active');
        });
    }
}

// ========== CONFIGURAR NAVEGAÇÃO DO MENU ==========
function setupPageNavigation() {
    const menuItems = document.querySelectorAll('.nav-item');

    menuItems.forEach(item => {
        const pageKey = item.dataset.page;
        if (pageKey && pageKey in PAGES) {
            item.setAttribute('href', getPageUrl(pageKey));
        }
    });

    document.body.addEventListener('click', (e) => {
        const item = e.target.closest('.nav-item');
        if (!item) return;

        const pageKey = item.dataset.page;
        if (!pageKey || !(pageKey in PAGES)) return;

        e.preventDefault();
        window.location.href = getPageUrl(pageKey);
    });
}

// ========== CONFIGURAR MENU ATIVO ==========
function setupActiveMenu() {
    const currentPage = window.location.pathname.split('/').pop();
    const menuItems = document.querySelectorAll('.nav-item');

    menuItems.forEach(item => {
        const pageKey = item.dataset.page;
        let target = item.getAttribute('href');

        if (pageKey && pageKey in PAGES) {
            target = PAGES[pageKey];
        }

        const normalizedTarget = target.split('/').pop();
        if (normalizedTarget === currentPage) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

// ========== CARREGAR DADOS DO USUÁRIO NO MENU ==========
function loadUserInfo() {
    const userNameSpan = document.getElementById('userName');
    const userEmailSpan = document.getElementById('userEmail');
    
    if (userNameSpan) userNameSpan.textContent = getUserName();
    if (userEmailSpan) userEmailSpan.textContent = getUserEmail();
}

// ========== INICIALIZAÇÃO PADRÃO PARA TODAS AS TELAS ==========
function initPage() {
    if (!isAuthenticated()) return;
    setupPageNavigation();
    loadUserInfo();
    setupMobileMenu();
    setupActiveMenu();
    
    // Configurar logout se existir
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', logout);
}