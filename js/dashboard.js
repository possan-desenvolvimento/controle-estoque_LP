// ============================================
// DASHBOARD.JS - Tela principal do sistema
// ============================================

// Dados mock (depois vem do backend)
const salesData = {
    labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
    values: [1250, 890, 2100, 1560, 2870, 3420, 1890]
};

const criticalProducts = [
    { name: 'Coca-Cola 2L', code: '7891234567890', stock: 3, min: 10 },
    { name: 'Arroz 5kg', code: '7891234567891', stock: 2, min: 15 },
    { name: 'Feijão 1kg', code: '7891234567892', stock: 5, min: 20 },
    { name: 'Óleo de Soja', code: '7891234567893', stock: 4, min: 12 },
    { name: 'Açúcar 1kg', code: '7891234567894', stock: 1, min: 10 }
];

let salesChart = null;

document.addEventListener('DOMContentLoaded', () => {
    initPage(); // Função do global.js
    
    loadDashboardData();
    loadCriticalStockTable();
    loadSalesChart();
});

function loadDashboardData() {
    const vendasHoje = 3420;
    const totalProdutos = 247;
    const clientesHoje = 18;
    const estoqueCritico = criticalProducts.length;
    
    const vendasHojeEl = document.getElementById('vendasHoje');
    const estoqueCriticoEl = document.getElementById('estoqueCritico');
    const totalProdutosEl = document.getElementById('totalProdutos');
    const clientesHojeEl = document.getElementById('clientesHoje');
    
    if (vendasHojeEl) vendasHojeEl.textContent = formatCurrency(vendasHoje);
    if (estoqueCriticoEl) estoqueCriticoEl.textContent = estoqueCritico;
    if (totalProdutosEl) totalProdutosEl.textContent = totalProdutos;
    if (clientesHojeEl) clientesHojeEl.textContent = clientesHoje;
}

function loadSalesChart() {
    const canvas = document.getElementById('vendasChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    if (salesChart) salesChart.destroy();
    
    salesChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: salesData.labels,
            datasets: [{
                label: 'Vendas (R$)',
                data: salesData.values,
                borderColor: '#3B82F6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#3B82F6',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { position: 'top' },
                tooltip: {
                    callbacks: {
                        label: (context) => formatCurrency(context.raw)
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: (value) => formatCurrency(value)
                    }
                }
            }
        }
    });
}

function loadCriticalStockTable() {
    const tableBody = document.querySelector('#tabelaEstoqueCritico tbody');
    if (!tableBody) return;
    
    if (criticalProducts.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4" style="text-align: center;">✅ Nenhum produto com estoque crítico</td></tr>';
        return;
    }
    
    tableBody.innerHTML = criticalProducts.map(product => `
        <tr>
            <td>${product.name}</td>
            <td>${product.code}</td>
            <td class="status-critical">${product.stock} unid.</td>
            <td>${product.min} unid.</td>
        </tr>
    `).join('');
}

// Botão ver todos
document.addEventListener('click', (e) => {
    if (e.target.id === 'verTodosBtn') {
        window.location.href = PAGES.estoque;
    }
});

// Atualizar a cada 30 segundos
setInterval(() => {
    loadDashboardData();
    loadCriticalStockTable();
}, 30000);