// ============================================
// VENDAS.JS - PDV (Ponto de Venda)
// ============================================

// Carrinho de compras
let carrinho = [];
let clienteAtual = null;
let desconto = { valor: 0, tipo: 'fixo' };
let scannerAtivoVendas = false;
let scannerStreamVendas = null;

// Produtos do estoque (mock)
const produtosEstoque = [
    {
        id: '1',
        nome: 'Ração Premium Cães',
        codigo: '7891234567890',
        categoria: 'racao',
        preco: 89.90,
        precoKilo: 29.90,
        estoque: 15,
        foto: null
    },
    {
        id: '2',
        nome: 'Brinquedo Mordedor',
        codigo: '7891234567891',
        categoria: 'brinquedos',
        preco: 25.90,
        precoKilo: null,
        estoque: 8,
        foto: null
    },
    {
        id: '3',
        nome: 'Vermífugo Cães',
        codigo: '7891234567892',
        categoria: 'remedios',
        preco: 45.50,
        precoKilo: null,
        estoque: 3,
        foto: null
    },
    {
        id: '4',
        nome: 'Casinha Pet',
        codigo: '7891234567893',
        categoria: 'casinhas',
        preco: 299.90,
        precoKilo: null,
        estoque: 2,
        foto: null
    },
    {
        id: '5',
        nome: 'Ração Gatos Premium',
        codigo: '7891234567894',
        categoria: 'racao',
        preco: 79.90,
        precoKilo: 26.90,
        estoque: 10,
        foto: null
    }
];

let produtosFiltradosVendas = [...produtosEstoque];
let categoriaAtual = 'todos';

document.addEventListener('DOMContentLoaded', () => {
    initPage();
    
    setupEventListeners();
    loadProdutosGrid();
    atualizarCarrinho();
    
    // Aba padrão: scanner
    ativarAba('scanner');
});

function setupEventListeners() {
    // Tabs
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => ativarAba(btn.dataset.tab));
    });
    
    // Busca de produtos
    const buscaInput = document.getElementById('buscaProdutoInput');
    if (buscaInput) buscaInput.addEventListener('input', filtrarProdutosGrid);
    
    // Filtros rápidos
    const filtrosChips = document.querySelectorAll('.filtro-chip');
    filtrosChips.forEach(chip => {
        chip.addEventListener('click', () => {
            filtrosChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            categoriaAtual = chip.dataset.categoria;
            filtrarProdutosGrid();
        });
    });
    
    // Scanner
    const ativarScannerBtn = document.getElementById('ativarScannerBtn');
    if (ativarScannerBtn) ativarScannerBtn.addEventListener('click', ativarScannerVendas);
    
    const buscarCodigoBtn = document.getElementById('buscarCodigoBtn');
    const codigoBarrasInput = document.getElementById('codigoBarrasInput');
    if (buscarCodigoBtn && codigoBarrasInput) {
        buscarCodigoBtn.addEventListener('click', () => {
            buscarProdutoPorCodigoVendas(codigoBarrasInput.value);
            codigoBarrasInput.value = '';
        });
        codigoBarrasInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                buscarProdutoPorCodigoVendas(codigoBarrasInput.value);
                codigoBarrasInput.value = '';
            }
        });
    }
    
    // Desconto
    const descontoValor = document.getElementById('descontoValor');
    const descontoTipo = document.getElementById('descontoTipo');
    if (descontoValor) descontoValor.addEventListener('input', () => {
        desconto.valor = parseFloat(descontoValor.value) || 0;
        desconto.tipo = descontoTipo.value;
        atualizarCarrinho();
    });
    if (descontoTipo) descontoTipo.addEventListener('change', () => {
        desconto.tipo = descontoTipo.value;
        atualizarCarrinho();
    });
    
    // Selecionar cliente
    const selecionarClienteBtn = document.getElementById('selecionarClienteBtn');
    if (selecionarClienteBtn) selecionarClienteBtn.addEventListener('click', openSelecionarClienteModal);
    
    // Finalizar venda
    const finalizarVendaBtn = document.getElementById('finalizarVendaBtn');
    if (finalizarVendaBtn) finalizarVendaBtn.addEventListener('click', openFinalizarVendaModal);
    
    // Nova venda
    const novaVendaBtn = document.getElementById('novaVendaBtn');
    if (novaVendaBtn) novaVendaBtn.addEventListener('click', novaVenda);
    
    // Modais
    setupModalEvents();
}

function ativarAba(tabId) {
    const tabs = document.querySelectorAll('.tab-content');
    const btns = document.querySelectorAll('.tab-btn');
    
    tabs.forEach(tab => tab.classList.remove('active'));
    btns.forEach(btn => btn.classList.remove('active'));
    
    const tabAtiva = document.getElementById(`tab${tabId.charAt(0).toUpperCase() + tabId.slice(1)}`);
    if (tabAtiva) tabAtiva.classList.add('active');
    
    const btnAtivo = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
    if (btnAtivo) btnAtivo.classList.add('active');
}

function loadProdutosGrid() {
    const grid = document.getElementById('produtosGrid');
    if (!grid) return;
    
    if (produtosFiltradosVendas.length === 0) {
        grid.innerHTML = '<div class="loading-grid">Nenhum produto encontrado</div>';
        return;
    }
    
    grid.innerHTML = produtosFiltradosVendas.map(produto => `
        <div class="produto-card" data-id="${produto.id}">
            <div class="produto-foto">${produto.foto ? `<img src="${produto.foto}">` : '🐾'}</div>
            <div class="produto-nome">${produto.nome}</div>
            <div class="produto-preco">${formatCurrency(produto.preco)}</div>
            ${produto.precoKilo ? `<div class="produto-preco-kilo">${formatCurrency(produto.precoKilo)}/kg</div>` : ''}
            <div class="produto-estoque">Estoque: ${produto.estoque} unid.</div>
        </div>
    `).join('');
    
    // Adicionar evento de clique nos produtos
    document.querySelectorAll('.produto-card').forEach(card => {
        card.addEventListener('click', () => {
            const produto = produtosEstoque.find(p => p.id === card.dataset.id);
            if (produto) adicionarAoCarrinho(produto);
        });
    });
}

function filtrarProdutosGrid() {
    const searchTerm = document.getElementById('buscaProdutoInput')?.value.toLowerCase() || '';
    
    produtosFiltradosVendas = produtosEstoque.filter(produto => {
        const matchSearch = produto.nome.toLowerCase().includes(searchTerm) || 
                           produto.codigo.includes(searchTerm);
        const matchCategoria = categoriaAtual === 'todos' || produto.categoria === categoriaAtual;
        
        return matchSearch && matchCategoria;
    });
    
    loadProdutosGrid();
}

function ativarScannerVendas() {
    const video = document.getElementById('scannerVideo');
    const placeholder = document.getElementById('scannerPlaceholder');
    
    if (!video) return;
    
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then(stream => {
            scannerStreamVendas = stream;
            video.srcObject = stream;
            video.style.display = 'block';
            if (placeholder) placeholder.style.display = 'none';
            scannerAtivoVendas = true;
            
            // Simular leitura após 3 segundos
            setTimeout(() => {
                const codigoLido = '7891234567890';
                buscarProdutoPorCodigoVendas(codigoLido);
            }, 3000);
        })
        .catch(err => {
            console.error('Erro ao acessar câmera:', err);
            alert('Não foi possível acessar a câmera. Use a busca manual.');
        });
}

function buscarProdutoPorCodigoVendas(codigo) {
    const produto = produtosEstoque.find(p => p.codigo === codigo);
    const resultadoDiv = document.getElementById('scannerResultado');
    const resultadoNome = document.getElementById('scannerProdutoNome');
    const resultadoCodigo = document.getElementById('scannerProdutoCodigo');
    
    if (resultadoDiv && resultadoNome && resultadoCodigo) {
        if (produto) {
            resultadoNome.textContent = produto.nome;
            resultadoCodigo.textContent = `Código: ${produto.codigo}`;
            resultadoDiv.style.display = 'block';
            
            setTimeout(() => {
                adicionarAoCarrinho(produto);
                resultadoDiv.style.display = 'none';
            }, 1500);
        } else {
            resultadoNome.textContent = 'Produto não encontrado!';
            resultadoCodigo.textContent = `Código: ${codigo}`;
            resultadoDiv.style.display = 'block';
        }
    }
}

function adicionarAoCarrinho(produto) {
    // Se for produto por kilo, abrir modal
    if (produto.precoKilo && produto.precoKilo > 0) {
        openProdutoKiloModal(produto);
        return;
    }
    
    const itemExistente = carrinho.find(item => item.id === produto.id);
    
    if (itemExistente) {
        itemExistente.quantidade++;
        itemExistente.subtotal = itemExistente.quantidade * itemExistente.preco;
    } else {
        carrinho.push({
            id: produto.id,
            nome: produto.nome,
            preco: produto.preco,
            quantidade: 1,
            subtotal: produto.preco,
            isKilo: false
        });
    }
    
    atualizarCarrinho();
}

function openProdutoKiloModal(produto) {
    const modal = document.getElementById('produtoKiloModal');
    if (!modal) return;
    
    document.getElementById('kiloProdutoNome').textContent = produto.nome;
    document.getElementById('kiloProdutoPreco').textContent = formatCurrency(produto.precoKilo) + '/kg';
    document.getElementById('kiloQuantidade').value = '1';
    calcularSubtotalKilo(produto.precoKilo);
    
    // Salvar produto temporariamente
    modal.dataset.produtoId = produto.id;
    modal.dataset.produtoPrecoKilo = produto.precoKilo;
    modal.dataset.produtoNome = produto.nome;
    
    modal.style.display = 'flex';
}

function calcularSubtotalKilo(precoKilo) {
    const quantidade = parseFloat(document.getElementById('kiloQuantidade')?.value) || 0;
    const subtotal = quantidade * precoKilo;
    document.getElementById('kiloSubtotal').textContent = formatCurrency(subtotal);
}

function confirmarAdicionarKilo() {
    const modal = document.getElementById('produtoKiloModal');
    const produtoId = modal.dataset.produtoId;
    const precoKilo = parseFloat(modal.dataset.produtoPrecoKilo);
    const produtoNome = modal.dataset.produtoNome;
    const quantidade = parseFloat(document.getElementById('kiloQuantidade')?.value) || 0;
    
    const produto = produtosEstoque.find(p => p.id === produtoId);
    if (!produto) return;
    
    const itemExistente = carrinho.find(item => item.id === produtoId);
    const subtotal = quantidade * precoKilo;
    
    if (itemExistente) {
        itemExistente.quantidade += quantidade;
        itemExistente.subtotal = itemExistente.quantidade * precoKilo;
    } else {
        carrinho.push({
            id: produtoId,
            nome: produtoNome,
            preco: precoKilo,
            quantidade: quantidade,
            subtotal: subtotal,
            isKilo: true,
            unidade: 'kg'
        });
    }
    
    atualizarCarrinho();
    closeProdutoKiloModal();
}

function atualizarCarrinho() {
    const carrinhoLista = document.getElementById('carrinhoLista');
    const itensCount = document.getElementById('itensCount');
    const subtotalEl = document.getElementById('subtotal');
    const totalEl = document.getElementById('totalVenda');
    
    // Calcular subtotal
    const subtotal = carrinho.reduce((acc, item) => acc + item.subtotal, 0);
    
    // Aplicar desconto
    let total = subtotal;
    if (desconto.tipo === 'fixo') {
        total = subtotal - desconto.valor;
    } else if (desconto.tipo === 'percent') {
        total = subtotal * (1 - desconto.valor / 100);
    }
    total = Math.max(total, 0);
    
    // Atualizar UI
    if (subtotalEl) subtotalEl.textContent = formatCurrency(subtotal);
    if (totalEl) totalEl.textContent = formatCurrency(total);
    if (itensCount) itensCount.textContent = `${carrinho.reduce((acc, item) => acc + item.quantidade, 0)} itens`;
    
    // Renderizar carrinho
    if (!carrinhoLista) return;
    
    if (carrinho.length === 0) {
        carrinhoLista.innerHTML = `
            <div class="carrinho-vazio">
                <span>🛒</span>
                <p>Adicione produtos escaneando ou buscando no estoque</p>
            </div>
        `;
        return;
    }
    
    carrinhoLista.innerHTML = carrinho.map((item, index) => `
        <div class="carrinho-item">
            <div class="item-foto">${item.isKilo ? '⚖️' : '📦'}</div>
            <div class="item-info">
                <div class="item-nome">${item.nome}</div>
                <div class="item-preco">${formatCurrency(item.preco)}${item.isKilo ? '/kg' : ''}</div>
            </div>
            <div class="item-quantidade">
                <button class="qtd-btn" data-index="${index}" data-delta="-1">-</button>
                <span class="qtd-valor">${item.quantidade}${item.isKilo ? 'kg' : ''}</span>
                <button class="qtd-btn" data-index="${index}" data-delta="1">+</button>
            </div>
            <div class="item-subtotal">${formatCurrency(item.subtotal)}</div>
            <button class="item-remove" data-index="${index}">✕</button>
        </div>
    `).join('');
    
    // Adicionar eventos dos botões
    document.querySelectorAll('.qtd-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const index = parseInt(btn.dataset.index);
            const delta = parseInt(btn.dataset.delta);
            alterarQuantidade(index, delta);
        });
    });
    
    document.querySelectorAll('.item-remove').forEach(btn => {
        btn.addEventListener('click', () => {
            const index = parseInt(btn.dataset.index);
            removerItemCarrinho(index);
        });
    });
}

function alterarQuantidade(index, delta) {
    if (!carrinho[index]) return;
    
    const novaQuantidade = carrinho[index].quantidade + delta;
    
    if (novaQuantidade <= 0) {
        carrinho.splice(index, 1);
    } else {
        carrinho[index].quantidade = novaQuantidade;
        carrinho[index].subtotal = novaQuantidade * carrinho[index].preco;
    }
    
    atualizarCarrinho();
}

function removerItemCarrinho(index) {
    carrinho.splice(index, 1);
    atualizarCarrinho();
}

function openSelecionarClienteModal() {
    const modal = document.getElementById('selecionarClienteModal');
    if (!modal) return;
    
    // Mock de clientes
    const clientesMock = [
        { id: '1', nome: 'João Silva', telefone: '(11) 99999-9999' },
        { id: '2', nome: 'Maria Oliveira', telefone: '(11) 98888-8888' },
        { id: '3', nome: 'Pedro Santos', telefone: '(11) 97777-7777' }
    ];
    
    const lista = document.getElementById('clientesModalLista');
    if (lista) {
        lista.innerHTML = clientesMock.map(cliente => `
            <div class="cliente-modal-item" data-id="${cliente.id}" data-nome="${cliente.nome}" data-telefone="${cliente.telefone}">
                <div class="cliente-info-modal">
                    <span class="cliente-nome-modal">${cliente.nome}</span>
                    <span class="cliente-telefone-modal">${cliente.telefone}</span>
                </div>
                <span>➕</span>
            </div>
        `).join('');
        
        document.querySelectorAll('.cliente-modal-item').forEach(item => {
            item.addEventListener('click', () => {
                clienteAtual = {
                    id: item.dataset.id,
                    nome: item.dataset.nome,
                    telefone: item.dataset.telefone
                };
                document.getElementById('clienteNome').textContent = clienteAtual.nome;
                closeSelecionarClienteModal();
            });
        });
    }
    
    modal.style.display = 'flex';
}

function closeSelecionarClienteModal() {
    const modal = document.getElementById('selecionarClienteModal');
    if (modal) modal.style.display = 'none';
}

function openFinalizarVendaModal() {
    if (carrinho.length === 0) {
        alert('Adicione produtos ao carrinho antes de finalizar a venda.');
        return;
    }
    
    const modal = document.getElementById('finalizarVendaModal');
    if (!modal) return;
    
    const totalItens = carrinho.reduce((acc, item) => acc + item.quantidade, 0);
    const subtotal = carrinho.reduce((acc, item) => acc + item.subtotal, 0);
    let total = subtotal;
    
    if (desconto.tipo === 'fixo') total = subtotal - desconto.valor;
    else if (desconto.tipo === 'percent') total = subtotal * (1 - desconto.valor / 100);
    total = Math.max(total, 0);
    
    document.getElementById('finalizarItens').textContent = totalItens;
    document.getElementById('finalizarSubtotal').textContent = formatCurrency(subtotal);
    document.getElementById('finalizarDesconto').textContent = desconto.tipo === 'fixo' ? formatCurrency(desconto.valor) : `${desconto.valor}%`;
    document.getElementById('finalizarTotal').textContent = formatCurrency(total);
    
    modal.style.display = 'flex';
}

function closeFinalizarVendaModal() {
    const modal = document.getElementById('finalizarVendaModal');
    if (modal) modal.style.display = 'none';
}

function confirmarFinalizarVenda() {
    const formaPagamento = document.getElementById('formaPagamento')?.value || 'dinheiro';
    const totalTexto = document.getElementById('finalizarTotal').textContent;
    const total = parseFloat(totalTexto.replace('R$', '').replace('.', '').replace(',', '.')) || 0;
    
    // Registrar venda (mock)
    const venda = {
        id: generateId(),
        data: new Date().toISOString(),
        cliente: clienteAtual,
        itens: [...carrinho],
        subtotal: carrinho.reduce((acc, item) => acc + item.subtotal, 0),
        desconto: desconto,
        total: total,
        pagamento: formaPagamento
    };
    
    // Salvar no localStorage para histórico
    const vendasSalvas = JSON.parse(localStorage.getItem('vendas') || '[]');
    vendasSalvas.push(venda);
    localStorage.setItem('vendas', JSON.stringify(vendasSalvas));
    
    // Mostrar comprovante
    mostrarComprovante(venda);
    closeFinalizarVendaModal();
}

function mostrarComprovante(venda) {
    const modal = document.getElementById('comprovanteModal');
    const content = document.getElementById('comprovanteContent');
    
    if (!modal || !content) return;
    
    content.innerHTML = `
        <div style="text-align: center; margin-bottom: 20px;">
            <strong>📦 LP Automações</strong><br>
            <small>CNPJ: 00.000.000/0001-00</small><br>
            <small>${formatDateTime(venda.data)}</small>
        </div>
        <div style="border-top: 1px dashed #ccc; margin: 10px 0;"></div>
        ${venda.itens.map(item => `
            <div class="comprovante-linha">
                <span>${item.quantidade}${item.isKilo ? 'kg' : ''} x ${item.nome}</span>
                <span>${formatCurrency(item.subtotal)}</span>
            </div>
        `).join('')}
        <div style="border-top: 1px dashed #ccc; margin: 10px 0;"></div>
        <div class="comprovante-linha">
            <span>Subtotal:</span>
            <span>${formatCurrency(venda.subtotal)}</span>
        </div>
        <div class="comprovante-linha">
            <span>Desconto (${venda.desconto.tipo === 'fixo' ? 'R$' : '%'}):</span>
            <span>${venda.desconto.tipo === 'fixo' ? formatCurrency(venda.desconto.valor) : `${venda.desconto.valor}%`}</span>
        </div>
        <div class="comprovante-total">
            <span>TOTAL:</span>
            <span>${formatCurrency(venda.total)}</span>
        </div>
        <div style="border-top: 1px dashed #ccc; margin: 10px 0;"></div>
        <div class="comprovante-linha">
            <span>Pagamento:</span>
            <span>${getFormaPagamentoNome(venda.pagamento)}</span>
        </div>
        <div style="text-align: center; margin-top: 20px;">
            <small>Obrigado pela preferência!</small><br>
            <small>Volte sempre! 🐾</small>
        </div>
    `;
    
    modal.style.display = 'flex';
}

function getFormaPagamentoNome(pagamento) {
    const formas = {
        dinheiro: 'Dinheiro',
        pix: 'PIX',
        debito: 'Cartão Débito',
        credito: 'Cartão Crédito',
        transferencia: 'Transferência'
    };
    return formas[pagamento] || pagamento;
}

function novaVenda() {
    carrinho = [];
    clienteAtual = null;
    desconto = { valor: 0, tipo: 'fixo' };
    
    document.getElementById('clienteNome').textContent = 'Não informado';
    document.getElementById('descontoValor').value = '0';
    document.getElementById('descontoTipo').value = 'fixo';
    document.getElementById('formaPagamento').value = 'dinheiro';
    
    atualizarCarrinho();
}

function closeProdutoKiloModal() {
    const modal = document.getElementById('produtoKiloModal');
    if (modal) modal.style.display = 'none';
}

function setupModalEvents() {
    // Modal cliente
    const closeClienteModalBtn = document.getElementById('closeClienteModalBtn');
    const cancelarClienteBtn = document.getElementById('cancelarClienteBtn');
    const clienteAvulsoBtn = document.getElementById('clienteAvulsoBtn');
    
    if (closeClienteModalBtn) closeClienteModalBtn.addEventListener('click', closeSelecionarClienteModal);
    if (cancelarClienteBtn) cancelarClienteBtn.addEventListener('click', closeSelecionarClienteModal);
    if (clienteAvulsoBtn) {
        clienteAvulsoBtn.addEventListener('click', () => {
            clienteAtual = null;
            document.getElementById('clienteNome').textContent = 'Não informado';
            closeSelecionarClienteModal();
        });
    }
    
    // Modal finalizar
    const closeFinalizarModalBtn = document.getElementById('closeFinalizarModalBtn');
    const cancelarFinalizarBtn = document.getElementById('cancelarFinalizarBtn');
    const confirmarFinalizarBtn = document.getElementById('confirmarFinalizarBtn');
    
    if (closeFinalizarModalBtn) closeFinalizarModalBtn.addEventListener('click', closeFinalizarVendaModal);
    if (cancelarFinalizarBtn) cancelarFinalizarBtn.addEventListener('click', closeFinalizarVendaModal);
    if (confirmarFinalizarBtn) confirmarFinalizarBtn.addEventListener('click', confirmarFinalizarVenda);
    
    // Modal kilo
    const closeKiloModalBtn = document.getElementById('closeKiloModalBtn');
    const cancelarKiloBtn = document.getElementById('cancelarKiloBtn');
    const confirmarKiloBtn = document.getElementById('confirmarKiloBtn');
    const kiloQuantidade = document.getElementById('kiloQuantidade');
    
    if (closeKiloModalBtn) closeKiloModalBtn.addEventListener('click', closeProdutoKiloModal);
    if (cancelarKiloBtn) cancelarKiloBtn.addEventListener('click', closeProdutoKiloModal);
    if (confirmarKiloBtn) confirmarKiloBtn.addEventListener('click', confirmarAdicionarKilo);
    if (kiloQuantidade) kiloQuantidade.addEventListener('input', () => {
        const precoKilo = parseFloat(document.getElementById('produtoKiloModal')?.dataset?.produtoPrecoKilo) || 0;
        calcularSubtotalKilo(precoKilo);
    });
    
    // Modal comprovante
    const closeComprovanteBtn = document.getElementById('closeComprovanteBtn');
    const imprimirComprovanteBtn = document.getElementById('imprimirComprovanteBtn');
    const fecharComprovanteBtn = document.getElementById('fecharComprovanteBtn');
    
    if (closeComprovanteBtn) closeComprovanteBtn.addEventListener('click', () => {
        document.getElementById('comprovanteModal').style.display = 'none';
    });
    if (imprimirComprovanteBtn) {
        imprimirComprovanteBtn.addEventListener('click', () => {
            window.print();
        });
    }
    if (fecharComprovanteBtn) {
        fecharComprovanteBtn.addEventListener('click', () => {
            document.getElementById('comprovanteModal').style.display = 'none';
            novaVenda();
        });
    }
    
    // Troco
    const formaPagamento = document.getElementById('formaPagamento');
    const valorRecebido = document.getElementById('valorRecebido');
    if (formaPagamento) {
        formaPagamento.addEventListener('change', () => {
            const trocoGroup = document.getElementById('trocoGroup');
            if (formaPagamento.value === 'dinheiro') {
                trocoGroup.style.display = 'block';
            } else {
                trocoGroup.style.display = 'none';
            }
        });
    }
    
    if (valorRecebido) {
        valorRecebido.addEventListener('input', () => {
            const total = parseFloat(document.getElementById('finalizarTotal').textContent.replace('R$', '').replace('.', '').replace(',', '.')) || 0;
            const recebido = parseFloat(valorRecebido.value) || 0;
            const troco = recebido - total;
            
            const trocoInfo = document.getElementById('trocoInfo');
            const trocoValor = document.getElementById('trocoValor');
            
            if (troco > 0) {
                trocoInfo.style.display = 'block';
                trocoValor.textContent = formatCurrency(troco);
            } else {
                trocoInfo.style.display = 'none';
            }
        });
    }
}