// ============================================
// FINANCEIRO.JS - Tela de controle financeiro
// ============================================

// Dados mock (depois vem do backend)
let movimentacoes = [
    {
        id: '1',
        tipo: 'receita',
        data: '2024-06-15',
        descricao: 'Venda à vista - Cliente João',
        categoria: 'vendas',
        valor: 89.90,
        pagamento: 'pix',
        obs: ''
    },
    {
        id: '2',
        tipo: 'receita',
        data: '2024-06-14',
        descricao: 'Venda ração premium',
        categoria: 'vendas',
        valor: 150.00,
        pagamento: 'credito',
        obs: ''
    },
    {
        id: '3',
        tipo: 'despesa',
        data: '2024-06-10',
        descricao: 'Compra de mercadoria - PetFood',
        categoria: 'fornecedor',
        valor: 450.00,
        pagamento: 'transferencia',
        obs: ''
    },
    {
        id: '4',
        tipo: 'despesa',
        data: '2024-06-05',
        descricao: 'Aluguel da loja',
        categoria: 'aluguel',
        valor: 2000.00,
        pagamento: 'transferencia',
        obs: ''
    },
    {
        id: '5',
        tipo: 'receita',
        data: '2024-06-12',
        descricao: 'Venda de brinquedos',
        categoria: 'vendas',
        valor: 75.50,
        pagamento: 'dinheiro',
        obs: ''
    },
    {
        id: '6',
        tipo: 'despesa',
        data: '2024-06-08',
        descricao: 'Salário funcionários',
        categoria: 'salario',
        valor: 3000.00,
        pagamento: 'transferencia',
        obs: ''
    }
];

let movimentacoesFiltradas = [...movimentacoes];
let fluxoCaixaChart = null;
let movimentacaoEditandoId = null;

document.addEventListener('DOMContentLoaded', () => {
    initPage();
    
    loadFinanceiroData();
    loadExtratoTable();
    loadFluxoCaixaChart();
    setupEventListeners();
});

function loadFinanceiroData() {
    const hoje = new Date().toISOString().split('T')[0];
    const mesAtual = new Date().getMonth();
    const anoAtual = new Date().getFullYear();
    
    const receitasMes = movimentacoes
        .filter(m => m.tipo === 'receita' && new Date(m.data).getMonth() === mesAtual && new Date(m.data).getFullYear() === anoAtual)
        .reduce((acc, m) => acc + m.valor, 0);
    
    const despesasMes = movimentacoes
        .filter(m => m.tipo === 'despesa' && new Date(m.data).getMonth() === mesAtual && new Date(m.data).getFullYear() === anoAtual)
        .reduce((acc, m) => acc + m.valor, 0);
    
    const lucroLiquido = receitasMes - despesasMes;
    const saldoAtual = movimentacoes.reduce((acc, m) => acc + (m.tipo === 'receita' ? m.valor : -m.valor), 0);
    
    document.getElementById('saldoAtual').textContent = formatCurrency(saldoAtual);
    document.getElementById('receitasMes').textContent = formatCurrency(receitasMes);
    document.getElementById('despesasMes').textContent = formatCurrency(despesasMes);
    document.getElementById('lucroLiquido').textContent = formatCurrency(lucroLiquido);
    
    // Ajustar cor do lucro
    const lucroElement = document.getElementById('lucroLiquido');
    if (lucroElement) {
        if (lucroLiquido >= 0) {
            lucroElement.style.color = 'var(--success)';
        } else {
            lucroElement.style.color = 'var(--danger)';
        }
    }
}

function loadExtratoTable() {
    const tbody = document.getElementById('extratoTableBody');
    if (!tbody) return;
    
    if (movimentacoesFiltradas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Nenhuma movimentação encontrada</td></tr>';
        document.getElementById('movimentacoesCount').textContent = '0 movimentações';
        return;
    }
    
    tbody.innerHTML = movimentacoesFiltradas.map(mov => `
        <tr>
            <td>${formatDate(mov.data)}</td>
            <td>${mov.descricao}</td>
            <td>${getCategoriaNome(mov.categoria)}</td>
            <td>
                <span class="tipo-badge ${mov.tipo === 'receita' ? 'tipo-receita' : 'tipo-despesa'}">
                    ${mov.tipo === 'receita' ? 'Receita' : 'Despesa'}
                </span>
            </td>
            <td class="${mov.tipo === 'receita' ? 'valor-receita' : 'valor-despesa'}">
                ${mov.tipo === 'receita' ? '+' : '-'} ${formatCurrency(mov.valor)}
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon btn-edit" data-id="${mov.id}" title="Editar">✏️</button>
                    <button class="btn-icon btn-delete" data-id="${mov.id}" title="Excluir">🗑️</button>
                </div>
            </td>
        </table>
    `).join('');
    
    // Totais do extrato
    const totalReceitas = movimentacoesFiltradas
        .filter(m => m.tipo === 'receita')
        .reduce((acc, m) => acc + m.valor, 0);
    const totalDespesas = movimentacoesFiltradas
        .filter(m => m.tipo === 'despesa')
        .reduce((acc, m) => acc + m.valor, 0);
    const saldo = totalReceitas - totalDespesas;
    
    document.getElementById('totalReceitasExtrato').textContent = formatCurrency(totalReceitas);
    document.getElementById('totalDespesasExtrato').textContent = formatCurrency(totalDespesas);
    document.getElementById('saldoExtrato').textContent = formatCurrency(saldo);
    document.getElementById('movimentacoesCount').textContent = `${movimentacoesFiltradas.length} movimentações`;
    
    // Adicionar eventos dos botões
    document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', () => editarMovimentacao(btn.dataset.id));
    });
    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', () => confirmarExclusao(btn.dataset.id));
    });
}

function getCategoriaNome(categoria) {
    const categorias = {
        vendas: 'Vendas',
        fornecedor: 'Fornecedor',
        aluguel: 'Aluguel',
        salario: 'Salário',
        energia: 'Energia',
        agua: 'Água',
        internet: 'Internet',
        imposto: 'Impostos',
        servicos: 'Serviços',
        outras_receitas: 'Outras receitas',
        outros: 'Outros'
    };
    return categorias[categoria] || categoria;
}

function loadFluxoCaixaChart() {
    const canvas = document.getElementById('fluxoCaixaChart');
    if (!canvas) return;
    
    // Últimos 7 dias
    const ultimos7Dias = [];
    const receitas7Dias = [];
    const despesas7Dias = [];
    
    for (let i = 6; i >= 0; i--) {
        const data = new Date();
        data.setDate(data.getDate() - i);
        const dataStr = data.toISOString().split('T')[0];
        const diaSemana = data.toLocaleDateString('pt-BR', { weekday: 'short' });
        ultimos7Dias.push(diaSemana);
        
        const receitasDia = movimentacoes
            .filter(m => m.tipo === 'receita' && m.data === dataStr)
            .reduce((acc, m) => acc + m.valor, 0);
        const despesasDia = movimentacoes
            .filter(m => m.tipo === 'despesa' && m.data === dataStr)
            .reduce((acc, m) => acc + m.valor, 0);
        
        receitas7Dias.push(receitasDia);
        despesas7Dias.push(despesasDia);
    }
    
    const ctx = canvas.getContext('2d');
    if (fluxoCaixaChart) fluxoCaixaChart.destroy();
    
    fluxoCaixaChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ultimos7Dias,
            datasets: [
                {
                    label: 'Receitas',
                    data: receitas7Dias,
                    backgroundColor: 'rgba(16, 185, 129, 0.7)',
                    borderColor: '#10B981',
                    borderWidth: 1
                },
                {
                    label: 'Despesas',
                    data: despesas7Dias,
                    backgroundColor: 'rgba(239, 68, 68, 0.7)',
                    borderColor: '#EF4444',
                    borderWidth: 1
                }
            ]
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

function setupEventListeners() {
    // Botão nova movimentação
    const novaMovimentacaoBtn = document.getElementById('novaMovimentacaoBtn');
    if (novaMovimentacaoBtn) novaMovimentacaoBtn.addEventListener('click', openMovimentacaoModal);
    
    // Filtros
    const filtroPeriodo = document.getElementById('filtroPeriodo');
    const filtroTipo = document.getElementById('filtroTipo');
    const filtroCategoria = document.getElementById('filtroCategoria');
    
    if (filtroPeriodo) filtroPeriodo.addEventListener('change', filtrarMovimentacoes);
    if (filtroTipo) filtroTipo.addEventListener('change', filtrarMovimentacoes);
    if (filtroCategoria) filtroCategoria.addEventListener('change', filtrarMovimentacoes);
    
    // Botão aplicar filtro de data
    const aplicarFiltro = document.getElementById('aplicarFiltro');
    if (aplicarFiltro) aplicarFiltro.addEventListener('click', filtrarMovimentacoes);
    
    // Toggle receita/despesa no modal
    const tipoReceitaBtn = document.getElementById('tipoReceitaBtn');
    const tipoDespesaBtn = document.getElementById('tipoDespesaBtn');
    if (tipoReceitaBtn) tipoReceitaBtn.addEventListener('click', () => setTipoMovimentacao('receita'));
    if (tipoDespesaBtn) tipoDespesaBtn.addEventListener('click', () => setTipoMovimentacao('despesa'));
    
    // Modal movimentação
    const closeMovimentacaoBtn = document.getElementById('closeMovimentacaoBtn');
    const cancelarMovimentacaoBtn = document.getElementById('cancelarMovimentacaoBtn');
    if (closeMovimentacaoBtn) closeMovimentacaoBtn.addEventListener('click', closeMovimentacaoModal);
    if (cancelarMovimentacaoBtn) cancelarMovimentacaoBtn.addEventListener('click', closeMovimentacaoModal);
    
    const movimentacaoForm = document.getElementById('movimentacaoForm');
    if (movimentacaoForm) movimentacaoForm.addEventListener('submit', salvarMovimentacao);
    
    // Modal confirmação exclusão
    const closeConfirmarBtn = document.getElementById('closeConfirmarBtn');
    const cancelarExclusaoBtn = document.getElementById('cancelarExclusaoBtn');
    if (closeConfirmarBtn) closeConfirmarBtn.addEventListener('click', closeConfirmarModal);
    if (cancelarExclusaoBtn) cancelarExclusaoBtn.addEventListener('click', closeConfirmarModal);
    
    const confirmarExclusaoBtn = document.getElementById('confirmarExclusaoBtn');
    if (confirmarExclusaoBtn) confirmarExclusaoBtn.addEventListener('click', executarExclusao);
    
    // Data atual no modal
    const movimentacaoData = document.getElementById('movimentacaoData');
    if (movimentacaoData) {
        movimentacaoData.value = new Date().toISOString().split('T')[0];
    }
}

function setTipoMovimentacao(tipo) {
    const tipoReceitaBtn = document.getElementById('tipoReceitaBtn');
    const tipoDespesaBtn = document.getElementById('tipoDespesaBtn');
    const movimentacaoTipo = document.getElementById('movimentacaoTipo');
    const categoriaSelect = document.getElementById('movimentacaoCategoria');
    
    if (tipo === 'receita') {
        tipoReceitaBtn.classList.add('active');
        tipoDespesaBtn.classList.remove('active');
        movimentacaoTipo.value = 'receita';
        // Atualizar opções de categoria para receitas
        categoriaSelect.innerHTML = `
            <optgroup label="Receitas">
                <option value="vendas">💰 Vendas</option>
                <option value="servicos">🔧 Serviços</option>
                <option value="outras_receitas">📌 Outras receitas</option>
            </optgroup>
        `;
    } else {
        tipoReceitaBtn.classList.remove('active');
        tipoDespesaBtn.classList.add('active');
        movimentacaoTipo.value = 'despesa';
        // Atualizar opções de categoria para despesas
        categoriaSelect.innerHTML = `
            <optgroup label="Despesas">
                <option value="fornecedor">📦 Fornecedor</option>
                <option value="aluguel">🏠 Aluguel</option>
                <option value="salario">👥 Salário</option>
                <option value="energia">⚡ Energia</option>
                <option value="agua">💧 Água</option>
                <option value="internet">🌐 Internet</option>
                <option value="imposto">📄 Impostos</option>
                <option value="outros">📌 Outros</option>
            </optgroup>
        `;
    }
}

function openMovimentacaoModal(movimentacaoId = null) {
    movimentacaoEditandoId = movimentacaoId;
    const modal = document.getElementById('movimentacaoModal');
    const title = document.getElementById('movimentacaoModalTitle');
    
    if (movimentacaoId) {
        const mov = movimentacoes.find(m => m.id === movimentacaoId);
        if (mov) {
            title.textContent = '✏️ Editar Movimentação';
            document.getElementById('movimentacaoData').value = mov.data;
            document.getElementById('movimentacaoDescricao').value = mov.descricao;
            document.getElementById('movimentacaoValor').value = mov.valor;
            document.getElementById('movimentacaoPagamento').value = mov.pagamento;
            document.getElementById('movimentacaoObs').value = mov.obs || '';
            setTipoMovimentacao(mov.tipo);
            
            // Ajustar categoria depois de setar o tipo
            setTimeout(() => {
                document.getElementById('movimentacaoCategoria').value = mov.categoria;
            }, 50);
        }
    } else {
        title.textContent = '➕ Nova Movimentação';
        document.getElementById('movimentacaoForm').reset();
        document.getElementById('movimentacaoData').value = new Date().toISOString().split('T')[0];
        setTipoMovimentacao('receita');
        movimentacaoEditandoId = null;
    }
    
    if (modal) modal.style.display = 'flex';
}

function closeMovimentacaoModal() {
    const modal = document.getElementById('movimentacaoModal');
    if (modal) modal.style.display = 'none';
}

function salvarMovimentacao(e) {
    e.preventDefault();
    
    const movimentacao = {
        id: movimentacaoEditandoId || generateId(),
        tipo: document.getElementById('movimentacaoTipo').value,
        data: document.getElementById('movimentacaoData').value,
        descricao: document.getElementById('movimentacaoDescricao').value,
        categoria: document.getElementById('movimentacaoCategoria').value,
        valor: parseFloat(document.getElementById('movimentacaoValor').value),
        pagamento: document.getElementById('movimentacaoPagamento').value,
        obs: document.getElementById('movimentacaoObs').value || ''
    };
    
    if (movimentacaoEditandoId) {
        const index = movimentacoes.findIndex(m => m.id === movimentacaoEditandoId);
        if (index !== -1) movimentacoes[index] = movimentacao;
    } else {
        movimentacoes.push(movimentacao);
    }
    
    movimentacoesFiltradas = [...movimentacoes];
    
    loadFinanceiroData();
    loadExtratoTable();
    loadFluxoCaixaChart();
    closeMovimentacaoModal();
    
    alert(movimentacaoEditandoId ? 'Movimentação atualizada!' : 'Movimentação adicionada!');
}

let movimentacaoParaExcluir = null;

function confirmarExclusao(movimentacaoId) {
    const mov = movimentacoes.find(m => m.id === movimentacaoId);
    if (!mov) return;
    
    movimentacaoParaExcluir = movimentacaoId;
    const detalhe = document.getElementById('movimentoDetalhe');
    if (detalhe) detalhe.textContent = `${mov.descricao} - ${formatCurrency(mov.valor)}`;
    
    const modal = document.getElementById('confirmarModal');
    if (modal) modal.style.display = 'flex';
}

function closeConfirmarModal() {
    const modal = document.getElementById('confirmarModal');
    if (modal) modal.style.display = 'none';
    movimentacaoParaExcluir = null;
}

function executarExclusao() {
    if (movimentacaoParaExcluir) {
        movimentacoes = movimentacoes.filter(m => m.id !== movimentacaoParaExcluir);
        movimentacoesFiltradas = [...movimentacoes];
        
        loadFinanceiroData();
        loadExtratoTable();
        loadFluxoCaixaChart();
        closeConfirmarModal();
        
        alert('Movimentação excluída!');
    }
}

function filtrarMovimentacoes() {
    const periodo = document.getElementById('filtroPeriodo')?.value || 'mes';
    const tipo = document.getElementById('filtroTipo')?.value || 'todos';
    const categoria = document.getElementById('filtroCategoria')?.value || 'todos';
    
    const hoje = new Date();
    let dataInicio = new Date();
    
    switch(periodo) {
        case 'hoje':
            dataInicio = new Date(hoje.setHours(0,0,0,0));
            break;
        case 'semana':
            dataInicio = new Date(hoje);
            dataInicio.setDate(hoje.getDate() - 7);
            break;
        case 'mes':
            dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
            break;
        case 'ano':
            dataInicio = new Date(hoje.getFullYear(), 0, 1);
            break;
        default:
            dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    }
    
    movimentacoesFiltradas = movimentacoes.filter(mov => {
        const dataMov = new Date(mov.data);
        const matchData = dataMov >= dataInicio;
        const matchTipo = tipo === 'todos' || mov.tipo === tipo;
        const matchCategoria = categoria === 'todos' || mov.categoria === categoria;
        
        return matchData && matchTipo && matchCategoria;
    });
    
    loadExtratoTable();
}