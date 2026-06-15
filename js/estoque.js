// ============================================
// ESTOQUE.JS - Tela de gerenciamento de estoque
// ============================================

// Dados mock
let produtos = [
    {
        id: '1',
        nome: 'Ração Premium Cães',
        codigo: '7891234567890',
        categoria: 'racao',
        preco: 89.90,
        precoKilo: 29.90,
        estoque: 15,
        estoqueMinimo: 5,
        fornecedor: 'PetFood Brasil',
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
        estoqueMinimo: 5,
        fornecedor: 'PetBrinquedos',
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
        estoqueMinimo: 10,
        fornecedor: 'VetFarma',
        foto: null
    }
];

let produtosFiltrados = [...produtos];
let scannerAtivo = false;
let scannerVideo = null;
let scannerStream = null;

document.addEventListener('DOMContentLoaded', () => {
    initPage();
    
    loadEstoqueData();
    loadProdutosTable();
    setupEventListeners();
});

function loadEstoqueData() {
    const totalProdutos = produtos.length;
    const estoqueCritico = produtos.filter(p => p.estoque <= p.estoqueMinimo && p.estoque > 0).length;
    const produtosPorKilo = produtos.filter(p => p.precoKilo && p.precoKilo > 0).length;
    const produtosEmFalta = produtos.filter(p => p.estoque === 0).length;
    
    document.getElementById('totalProdutos').textContent = totalProdutos;
    document.getElementById('estoqueCritico').textContent = estoqueCritico;
    document.getElementById('produtosPorKilo').textContent = produtosPorKilo;
    document.getElementById('produtosEmFalta').textContent = produtosEmFalta;
}

function loadProdutosTable() {
    const tbody = document.getElementById('produtosTableBody');
    if (!tbody) return;
    
    if (produtosFiltrados.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">Nenhum produto encontrado</td></tr>';
        return;
    }
    
    tbody.innerHTML = produtosFiltrados.map(produto => {
        let statusClass = 'status-normal';
        let statusText = 'Normal';
        
        if (produto.estoque === 0) {
            statusClass = 'status-falta';
            statusText = 'Em falta';
        } else if (produto.estoque <= produto.estoqueMinimo) {
            statusClass = 'status-critico';
            statusText = 'Crítico';
        }
        
        return `
            <tr>
                <td><div class="foto-produto">${produto.foto ? `<img src="${produto.foto}">` : '📦'}</div></td>
                <td><strong>${produto.nome}</strong></td>
                <td>${produto.codigo}</td>
                <td>${getCategoriaNome(produto.categoria)}</td>
                <td>
                    ${produto.preco ? `<span class="preco-unidade">${formatCurrency(produto.preco)}</span>` : '-'}
                    ${produto.precoKilo ? `<span class="preco-kilo">${formatCurrency(produto.precoKilo)}/kg</span>` : ''}
                </td>
                <td>${produto.estoque} unid.</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td>
                    <div class="action-buttons">
                        ${produto.precoKilo ? `<button class="btn-icon btn-kilo" data-id="${produto.id}" title="Vender por Kilo">⚖️</button>` : ''}
                        <button class="btn-icon btn-edit" data-id="${produto.id}" title="Editar">✏️</button>
                        <button class="btn-icon btn-delete" data-id="${produto.id}" title="Excluir">🗑️</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    
    // Adicionar eventos
    document.querySelectorAll('.btn-kilo').forEach(btn => {
        btn.addEventListener('click', () => openVendaKiloModal(btn.dataset.id));
    });
}

function getCategoriaNome(categoria) {
    const categorias = {
        racao: 'Ração',
        remedios: 'Remédios',
        brinquedos: 'Brinquedos',
        casinhas: 'Casinhas',
        acessorios: 'Acessórios'
    };
    return categorias[categoria] || categoria;
}

function setupEventListeners() {
    // Busca
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.addEventListener('input', filtrarProdutos);
    
    // Filtros
    const filtroCategoria = document.getElementById('filtroCategoria');
    const filtroStatus = document.getElementById('filtroStatus');
    if (filtroCategoria) filtroCategoria.addEventListener('change', filtrarProdutos);
    if (filtroStatus) filtroStatus.addEventListener('change', filtrarProdutos);
    
    // Botão escanear
    const btnEscanear = document.getElementById('btnEscanear');
    if (btnEscanear) btnEscanear.addEventListener('click', openScannerModal);
    
    // Botão novo produto
    const btnNovoProduto = document.getElementById('btnNovoProduto');
    if (btnNovoProduto) btnNovoProduto.addEventListener('click', openProdutoModal);
    
    // Modais
    setupModalEvents();
}

function filtrarProdutos() {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const categoria = document.getElementById('filtroCategoria')?.value || 'todos';
    const status = document.getElementById('filtroStatus')?.value || 'todos';
    
    produtosFiltrados = produtos.filter(produto => {
        const matchSearch = produto.nome.toLowerCase().includes(searchTerm) || 
                           produto.codigo.includes(searchTerm);
        
        const matchCategoria = categoria === 'todos' || produto.categoria === categoria;
        
        let matchStatus = true;
        if (status === 'critico') matchStatus = produto.estoque <= produto.estoqueMinimo && produto.estoque > 0;
        else if (status === 'falta') matchStatus = produto.estoque === 0;
        else if (status === 'normal') matchStatus = produto.estoque > produto.estoqueMinimo;
        
        return matchSearch && matchCategoria && matchStatus;
    });
    
    loadProdutosTable();
}

// ========== SCANNER ==========
function openScannerModal() {
    const modal = document.getElementById('scannerModal');
    if (modal) {
        modal.style.display = 'flex';
        ativarScanner();
    }
}

function ativarScanner() {
    if (scannerAtivo) return;
    
    const video = document.getElementById('scannerVideo');
    const placeholder = document.getElementById('scannerPlaceholder');
    
    if (!video) return;
    
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then(stream => {
            scannerStream = stream;
            video.srcObject = stream;
            video.style.display = 'block';
            if (placeholder) placeholder.style.display = 'none';
            scannerAtivo = true;
            
            // Simular leitura (com lib real usa QuaggaJS)
            setTimeout(() => {
                const codigoLido = '7891234567890';
                buscarProdutoPorCodigo(codigoLido);
            }, 3000);
        })
        .catch(err => {
            console.error('Erro ao acessar câmera:', err);
            alert('Não foi possível acessar a câmera. Verifique as permissões.');
        });
}

function buscarProdutoPorCodigo(codigo) {
    const produto = produtos.find(p => p.codigo === codigo);
    const resultadoDiv = document.getElementById('scannerResult');
    const resultadoNome = document.getElementById('scannerProdutoNome');
    const resultadoCodigo = document.getElementById('scannerProdutoCodigo');
    
    if (resultadoDiv && resultadoNome && resultadoCodigo) {
        if (produto) {
            resultadoNome.textContent = produto.nome;
            resultadoCodigo.textContent = `Código: ${produto.codigo}`;
            resultadoDiv.style.display = 'block';
            
            setTimeout(() => {
                adicionarAoCarrinho(produto);
                closeScannerModal();
            }, 1500);
        } else {
            resultadoNome.textContent = 'Produto não encontrado!';
            resultadoCodigo.textContent = `Código: ${codigo}`;
            resultadoDiv.style.display = 'block';
        }
    }
}

function adicionarAoCarrinho(produto) {
    alert(`Produto ${produto.nome} adicionado ao carrinho!`);
    // TODO: Integrar com o carrinho de vendas
}

function closeScannerModal() {
    if (scannerStream) {
        scannerStream.getTracks().forEach(track => track.stop());
        scannerStream = null;
    }
    scannerAtivo = false;
    
    const modal = document.getElementById('scannerModal');
    if (modal) modal.style.display = 'none';
}

function setupModalEvents() {
    // Fechar scanner
    const closeScannerBtn = document.getElementById('closeScannerBtn');
    if (closeScannerBtn) closeScannerBtn.addEventListener('click', closeScannerModal);
    
    // Buscar código manual
    const buscarCodigoBtn = document.getElementById('buscarCodigoBtn');
    const codigoManual = document.getElementById('codigoManual');
    if (buscarCodigoBtn && codigoManual) {
        buscarCodigoBtn.addEventListener('click', () => {
            buscarProdutoPorCodigo(codigoManual.value);
        });
    }
    
    // Modal produto
    const closeProdutoBtn = document.getElementById('closeProdutoBtn');
    const cancelarProdutoBtn = document.getElementById('cancelarProdutoBtn');
    if (closeProdutoBtn) closeProdutoBtn.addEventListener('click', closeProdutoModal);
    if (cancelarProdutoBtn) cancelarProdutoBtn.addEventListener('click', closeProdutoModal);
    
    const produtoForm = document.getElementById('produtoForm');
    if (produtoForm) produtoForm.addEventListener('submit', salvarProduto);
    
    // Upload foto
    const btnUploadFoto = document.getElementById('btnUploadFoto');
    const produtoFoto = document.getElementById('produtoFoto');
    if (btnUploadFoto && produtoFoto) {
        btnUploadFoto.addEventListener('click', () => produtoFoto.click());
        produtoFoto.addEventListener('change', previewFoto);
    }
    
    // Modal venda por kilo
    const closeAjustarBtn = document.getElementById('closeAjustarBtn');
    const cancelarAjustarBtn = document.getElementById('cancelarAjustarBtn');
    if (closeAjustarBtn) closeAjustarBtn.addEventListener('click', closeVendaKiloModal);
    if (cancelarAjustarBtn) cancelarAjustarBtn.addEventListener('click', closeVendaKiloModal);
    
    const quantidadeKilo = document.getElementById('quantidadeKilo');
    if (quantidadeKilo) quantidadeKilo.addEventListener('input', calcularTotalKilo);
    
    const confirmarVendaBtn = document.getElementById('confirmarVendaKiloBtn');
    if (confirmarVendaBtn) confirmarVendaBtn.addEventListener('click', confirmarVendaKilo);
}

function openProdutoModal(produtoId = null) {
    const modal = document.getElementById('produtoModal');
    const title = document.getElementById('produtoModalTitle');
    
    if (produtoId) {
        const produto = produtos.find(p => p.id === produtoId);
        if (produto) {
            title.textContent = '✏️ Editar Produto';
            document.getElementById('produtoNome').value = produto.nome;
            document.getElementById('produtoCodigo').value = produto.codigo;
            document.getElementById('produtoCategoria').value = produto.categoria;
            document.getElementById('produtoPreco').value = produto.preco;
            document.getElementById('produtoPrecoKilo').value = produto.precoKilo || '';
            document.getElementById('produtoEstoque').value = produto.estoque;
            document.getElementById('produtoEstoqueMinimo').value = produto.estoqueMinimo;
            document.getElementById('produtoFornecedor').value = produto.fornecedor || '';
        }
    } else {
        title.textContent = '➕ Novo Produto';
        document.getElementById('produtoForm').reset();
        document.getElementById('produtoPrecoKilo').value = '';
    }
    
    if (modal) modal.style.display = 'flex';
}

function closeProdutoModal() {
    const modal = document.getElementById('produtoModal');
    if (modal) modal.style.display = 'none';
}

function previewFoto(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const preview = document.getElementById('fotoPreview');
            preview.innerHTML = `<img src="${event.target.result}" style="width:100%;height:100%;object-fit:cover;">`;
        };
        reader.readAsDataURL(file);
    }
}

function salvarProduto(e) {
    e.preventDefault();
    
    const produto = {
        id: generateId(),
        nome: document.getElementById('produtoNome').value,
        codigo: document.getElementById('produtoCodigo').value,
        categoria: document.getElementById('produtoCategoria').value,
        preco: parseFloat(document.getElementById('produtoPreco').value) || 0,
        precoKilo: parseFloat(document.getElementById('produtoPrecoKilo').value) || null,
        estoque: parseInt(document.getElementById('produtoEstoque').value) || 0,
        estoqueMinimo: parseInt(document.getElementById('produtoEstoqueMinimo').value) || 5,
        fornecedor: document.getElementById('produtoFornecedor').value,
        foto: null
    };
    
    produtos.push(produto);
    produtosFiltrados = [...produtos];
    
    loadEstoqueData();
    loadProdutosTable();
    closeProdutoModal();
    
    alert(`Produto ${produto.nome} salvo com sucesso!`);
}

function openVendaKiloModal(produtoId) {
    const produto = produtos.find(p => p.id === produtoId);
    if (!produto || !produto.precoKilo) return;
    
    document.getElementById('produtoKiloNome').textContent = produto.nome;
    document.getElementById('valorKilo').value = formatCurrency(produto.precoKilo);
    document.getElementById('quantidadeKilo').value = '1';
    calcularTotalKilo();
    
    const modal = document.getElementById('ajustarEstoqueModal');
    if (modal) modal.style.display = 'flex';
}

function calcularTotalKilo() {
    const quantidade = parseFloat(document.getElementById('quantidadeKilo')?.value) || 0;
    const valorKiloTexto = document.getElementById('valorKilo')?.value || 'R$ 0,00';
    const valorKilo = parseFloat(valorKiloTexto.replace('R$', '').replace('.', '').replace(',', '.')) || 0;
    const total = quantidade * valorKilo;
    document.getElementById('totalVendaKilo').textContent = formatCurrency(total);
}

function confirmarVendaKilo() {
    // TODO: Registrar venda e dar baixa no estoque
    alert('Venda registrada com sucesso!');
    closeVendaKiloModal();
}

function closeVendaKiloModal() {
    const modal = document.getElementById('ajustarEstoqueModal');
    if (modal) modal.style.display = 'none';
}