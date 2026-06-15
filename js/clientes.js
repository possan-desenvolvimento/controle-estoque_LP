// ============================================
// CLIENTES.JS - Tela de gerenciamento de clientes
// ============================================

// Dados mock (depois vem do backend)
let clientes = [
    {
        id: '1',
        nome: 'João Silva',
        telefone: '(11) 99999-9999',
        totalGasto: 1250.50,
        ultimaCompra: '2024-06-10',
        compras: 5
    },
    {
        id: '2',
        nome: 'Maria Oliveira',
        telefone: '(11) 98888-8888',
        totalGasto: 3420.00,
        ultimaCompra: '2024-06-14',
        compras: 12
    },
    {
        id: '3',
        nome: 'Pedro Santos',
        telefone: '(11) 97777-7777',
        totalGasto: 890.30,
        ultimaCompra: '2024-05-20',
        compras: 2
    },
    {
        id: '4',
        nome: 'Ana Souza',
        telefone: '(11) 96666-6666',
        totalGasto: 2100.00,
        ultimaCompra: '2024-06-12',
        compras: 8
    }
];

let clientesFiltrados = [...clientes];

document.addEventListener('DOMContentLoaded', () => {
    initPage();
    
    loadClientesData();
    loadClientesTable();
    setupEventListeners();
});

function loadClientesData() {
    const totalClientes = clientes.length;
    const ticketMedio = clientes.reduce((acc, c) => acc + c.totalGasto, 0) / totalClientes;
    const topCliente = clientes.reduce((max, c) => c.totalGasto > max.totalGasto ? c : max, clientes[0]);
    const clientesInativos = clientes.filter(c => {
        const diasSemCompra = Math.floor((new Date() - new Date(c.ultimaCompra)) / (1000 * 60 * 60 * 24));
        return diasSemCompra > 30;
    }).length;
    
    document.getElementById('totalClientes').textContent = totalClientes;
    document.getElementById('ticketMedio').textContent = formatCurrency(ticketMedio);
    document.getElementById('topCliente').textContent = topCliente.nome;
    document.getElementById('clientesInativos').textContent = clientesInativos;
}

function loadClientesTable() {
    const tbody = document.getElementById('clientesTableBody');
    if (!tbody) return;
    
    if (clientesFiltrados.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Nenhum cliente encontrado</td></tr>';
        document.getElementById('clientesCount').textContent = '0 clientes';
        return;
    }
    
    tbody.innerHTML = clientesFiltrados.map(cliente => {
        const diasSemCompra = Math.floor((new Date() - new Date(cliente.ultimaCompra)) / (1000 * 60 * 60 * 24));
        const isInativo = diasSemCompra > 30;
        
        return `
            <tr>
                <td><strong>${cliente.nome}</strong></td>
                <td>${cliente.telefone}</td>
                <td>${formatCurrency(cliente.totalGasto)}</td>
                <td>${formatDate(cliente.ultimaCompra)}</td>
                <td>${cliente.compras} compras</td>
                <td>
                    <span class="status-badge ${isInativo ? 'status-inactive' : 'status-active'}">
                        ${isInativo ? 'Inativo' : 'Ativo'}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon btn-history" data-id="${cliente.id}" title="Histórico">📜</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    
    document.getElementById('clientesCount').textContent = `${clientesFiltrados.length} clientes`;
    
    // Adicionar eventos dos botões de histórico
    document.querySelectorAll('.btn-history').forEach(btn => {
        btn.addEventListener('click', () => showHistorico(btn.dataset.id));
    });
}

function setupEventListeners() {
    // Busca
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', filtrarClientes);
    }
    
    // Filtro de status
    const filtroStatus = document.getElementById('filtroStatus');
    if (filtroStatus) {
        filtroStatus.addEventListener('change', filtrarClientes);
    }
    
    // Botão novo cliente
    const novoClienteBtn = document.getElementById('novoClienteBtn');
    if (novoClienteBtn) {
        novoClienteBtn.addEventListener('click', openNovoClienteModal);
    }
    
    // Modal novo cliente
    const closeModalBtn = document.getElementById('closeModalBtn');
    const cancelarModalBtn = document.getElementById('cancelarModalBtn');
    const novoClienteForm = document.getElementById('novoClienteForm');
    
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeNovoClienteModal);
    if (cancelarModalBtn) cancelarModalBtn.addEventListener('click', closeNovoClienteModal);
    if (novoClienteForm) novoClienteForm.addEventListener('submit', salvarNovoCliente);
    
    // Fechar modal ao clicar fora
    const modal = document.getElementById('novoClienteModal');
    window.addEventListener('click', (e) => {
        if (e.target === modal) closeNovoClienteModal();
    });
    
    // Modal histórico
    const closeHistoricoBtn = document.getElementById('closeHistoricoBtn');
    if (closeHistoricoBtn) closeHistoricoBtn.addEventListener('click', closeHistoricoModal);
}

function filtrarClientes() {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const filtroStatus = document.getElementById('filtroStatus')?.value || 'todos';
    
    clientesFiltrados = clientes.filter(cliente => {
        // Busca
        const matchSearch = cliente.nome.toLowerCase().includes(searchTerm) || 
                           cliente.telefone.includes(searchTerm);
        
        // Status
        const diasSemCompra = Math.floor((new Date() - new Date(cliente.ultimaCompra)) / (1000 * 60 * 60 * 24));
        const isInativo = diasSemCompra > 30;
        
        let matchStatus = true;
        if (filtroStatus === 'ativos') matchStatus = !isInativo;
        else if (filtroStatus === 'inativos') matchStatus = isInativo;
        else if (filtroStatus === 'top') matchStatus = cliente.totalGasto > 1000;
        
        return matchSearch && matchStatus;
    });
    
    loadClientesTable();
}

function openNovoClienteModal() {
    const modal = document.getElementById('novoClienteModal');
    if (modal) {
        document.getElementById('clienteNome').value = '';
        document.getElementById('clienteTelefone').value = '';
        modal.style.display = 'flex';
    }
}

function closeNovoClienteModal() {
    const modal = document.getElementById('novoClienteModal');
    if (modal) modal.style.display = 'none';
}

function salvarNovoCliente(e) {
    e.preventDefault();
    
    const nome = document.getElementById('clienteNome').value;
    const telefone = document.getElementById('clienteTelefone').value;
    
    if (!nome || !telefone) {
        alert('Preencha todos os campos obrigatórios');
        return;
    }
    
    const novoCliente = {
        id: generateId(),
        nome: nome,
        telefone: maskPhone(telefone),
        totalGasto: 0,
        ultimaCompra: new Date().toISOString().split('T')[0],
        compras: 0
    };
    
    clientes.push(novoCliente);
    clientesFiltrados = [...clientes];
    
    loadClientesData();
    loadClientesTable();
    closeNovoClienteModal();
    
    alert(`Cliente ${nome} cadastrado com sucesso!`);
}

function showHistorico(clienteId) {
    const cliente = clientes.find(c => c.id === clienteId);
    if (!cliente) return;
    
    document.getElementById('historicoClienteNome').textContent = `📜 Histórico - ${cliente.nome}`;
    document.getElementById('historicoTotal').textContent = formatCurrency(cliente.totalGasto);
    document.getElementById('historicoUltima').textContent = formatDate(cliente.ultimaCompra);
    document.getElementById('historicoCompras').textContent = cliente.compras;
    
    // Mock de compras (depois vem do backend)
    const historicoCompras = [
        { data: '2024-06-10', valor: 150.00, produtos: 'Ração Premium 5kg' },
        { data: '2024-06-05', valor: 89.90, produtos: 'Brinquedo para cachorro' },
        { data: '2024-05-28', valor: 45.50, produtos: 'Remédio vermífugo' }
    ];
    
    const tbody = document.getElementById('historicoTableBody');
    tbody.innerHTML = historicoCompras.map(compra => `
        <tr>
            <td>${formatDate(compra.data)}</td>
            <td>${formatCurrency(compra.valor)}</td>
            <td>${compra.produtos}</td>
        </tr>
    `).join('');
    
    const modal = document.getElementById('historicoModal');
    if (modal) modal.style.display = 'flex';
}

function closeHistoricoModal() {
    const modal = document.getElementById('historicoModal');
    if (modal) modal.style.display = 'none';
}