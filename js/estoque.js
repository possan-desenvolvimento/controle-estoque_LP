// ============================================
// ESTOQUE.JS - Tela de gerenciamento de estoque
// ============================================

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
    },
    {
        id: '4',
        nome: 'Casinha Pet',
        codigo: '7891234567893',
        categoria: 'casinhas',
        preco: 299.90,
        precoKilo: null,
        estoque: 2,
        estoqueMinimo: 3,
        fornecedor: 'PetCasa',
        foto: null
    }
];

let produtosFiltrados = [...produtos];

// Scanner variables
let scannerAtivo = false;
let scannerStream = null;
let scannerTimeout = null;

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
    
    document.querySelectorAll('.btn-kilo').forEach(btn => {
        btn.addEventListener('click', () => openVendaKiloModal(btn.dataset.id));
    });
    
    document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', () => openProdutoModal(btn.dataset.id));
    });
    
    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', () => {
            if (confirm('Tem certeza que deseja excluir este produto?')) {
                produtos = produtos.filter(p => p.id !== btn.dataset.id);
                produtosFiltrados = [...produtos];
                loadEstoqueData();
                loadProdutosTable();
            }
        });
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
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.addEventListener('input', filtrarProdutos);
    
    const filtroCategoria = document.getElementById('filtroCategoria');
    const filtroStatus = document.getElementById('filtroStatus');
    if (filtroCategoria) filtroCategoria.addEventListener('change', filtrarProdutos);
    if (filtroStatus) filtroStatus.addEventListener('change', filtrarProdutos);
    
    const btnEscanear = document.getElementById('btnEscanear');
    if (btnEscanear) btnEscanear.addEventListener('click', openScannerModal);
    
    const btnNovoProduto = document.getElementById('btnNovoProduto');
    if (btnNovoProduto) btnNovoProduto.addEventListener('click', () => openProdutoModal(null));
    
    // Fechar scanner
    const closeScannerBtn = document.getElementById('closeScannerBtn');
    const cancelarScannerBtn = document.getElementById('cancelarScannerBtn');
    if (closeScannerBtn) closeScannerBtn.addEventListener('click', closeScannerModal);
    if (cancelarScannerBtn) cancelarScannerBtn.addEventListener('click', closeScannerModal);
    
    // Ativar scanner
    document.addEventListener('click', (e) => {
        if (e.target.id === 'ativarScannerBtn') ativarScanner();
    });
    
    // Buscar código manual
    const buscarCodigoBtn = document.getElementById('buscarCodigoBtn');
    const codigoManual = document.getElementById('codigoManual');
    if (buscarCodigoBtn && codigoManual) {
        buscarCodigoBtn.addEventListener('click', () => {
            buscarProdutoPorCodigo(codigoManual.value);
            codigoManual.value = '';
        });
        codigoManual.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                buscarProdutoPorCodigo(codigoManual.value);
                codigoManual.value = '';
            }
        });
    }
    
    // Modal produto
    const closeProdutoBtn = document.getElementById('closeProdutoBtn');
    const cancelarProdutoBtn = document.getElementById('cancelarProdutoBtn');
    if (closeProdutoBtn) closeProdutoBtn.addEventListener('click', closeProdutoModal);
    if (cancelarProdutoBtn) cancelarProdutoBtn.addEventListener('click', closeProdutoModal);
    
    const produtoForm = document.getElementById('produtoForm');
    if (produtoForm) produtoForm.addEventListener('submit', salvarProduto);
    
    const btnUploadFoto = document.getElementById('btnUploadFoto');
    const produtoFoto = document.getElementById('produtoFoto');
    if (btnUploadFoto && produtoFoto) {
        btnUploadFoto.addEventListener('click', () => produtoFoto.click());
        produtoFoto.addEventListener('change', previewFoto);
    }
    
    // Scanner no formulário
    const btnScanProduto = document.getElementById('btnScanProduto');
    if (btnScanProduto) {
        btnScanProduto.addEventListener('click', () => {
            openScannerModal();
            // Quando encontrar o código, preencher o campo
        });
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

// ============================================
// SCANNER OVERLAY - FUNÇÕES COMPLETAS
// ============================================

function openScannerModal() {
    const modal = document.getElementById('scannerModal');
    if (!modal) return;
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    const resultado = document.getElementById('scannerResultOverlay');
    if (resultado) resultado.style.display = 'none';
    
    const placeholder = document.getElementById('scannerPlaceholder');
    if (placeholder) {
        placeholder.style.display = 'flex';
        placeholder.innerHTML = `
            <span>📷</span>
            <p>Clique para ativar a câmera</p>
            <button class="btn-primary" id="ativarScannerBtn">Ativar Scanner</button>
        `;
        document.getElementById('ativarScannerBtn')?.addEventListener('click', ativarScanner);
    }
    
    const video = document.getElementById('scannerVideo');
    if (video) {
        video.style.display = 'none';
        video.srcObject = null;
    }
    
    const status = document.getElementById('scannerStatus');
    if (status) {
        status.textContent = 'Clique em "Ativar Scanner"';
        status.style.color = '#9CA3AF';
        status.style.animation = 'none';
    }
}

function closeScannerModal() {
    const modal = document.getElementById('scannerModal');
    if (!modal) return;
    
    if (scannerStream) {
        scannerStream.getTracks().forEach(track => track.stop());
        scannerStream = null;
    }
    scannerAtivo = false;
    
    if (scannerTimeout) {
        clearTimeout(scannerTimeout);
        scannerTimeout = null;
    }
    
    const video = document.getElementById('scannerVideo');
    if (video) {
        video.srcObject = null;
        video.style.display = 'none';
    }
    
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

function ativarScanner() {
    const video = document.getElementById('scannerVideo');
    const placeholder = document.getElementById('scannerPlaceholder');
    const status = document.getElementById('scannerStatus');
    
    if (!video) return;
    
    if (placeholder) {
        placeholder.innerHTML = `
            <div class="scanner-loading">
                <span>⏳</span>
                <p>Acessando câmera...</p>
                <div class="spinner"></div>
            </div>
        `;
    }
    
    if (status) {
        status.textContent = 'Acessando câmera...';
        status.style.color = '#F59E0B';
    }
    
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Seu navegador não suporta acesso à câmera.');
        if (placeholder) {
            placeholder.innerHTML = `
                <span>❌</span>
                <p>Navegador sem suporte à câmera</p>
                <p style="font-size:12px;color:#6B7280;">Use o campo manual abaixo</p>
            `;
        }
        return;
    }
    
    navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
            scannerStream = stream;
            video.srcObject = stream;
            video.style.display = 'block';
            if (placeholder) placeholder.style.display = 'none';
            scannerAtivo = true;
            
            if (status) {
                status.textContent = 'Aproxime o código';
                status.style.color = '#22c55e';
                status.style.animation = 'scannerPulse 1.5s ease-in-out infinite';
            }
            
            scannerTimeout = setTimeout(() => {
                if (scannerAtivo) {
                    const codigoTeste = '7891234567890';
                    buscarProdutoPorCodigo(codigoTeste);
                }
            }, 5000);
        })
        .catch(err => {
            console.error('Erro na câmera:', err);
            
            let mensagem = '';
            if (err.name === 'NotAllowedError') {
                mensagem = 'Permissão negada. Permita o acesso à câmera.';
            } else if (err.name === 'NotFoundError') {
                mensagem = 'Nenhuma câmera encontrada.';
            } else {
                mensagem = err.message || 'Erro ao acessar a câmera.';
            }
            
            if (placeholder) {
                placeholder.innerHTML = `
                    <span>❌</span>
                    <p>${mensagem}</p>
                    <p style="font-size:12px;color:#6B7280;">Use o campo manual abaixo</p>
                `;
            }
            
            if (status) {
                status.textContent = 'Erro na câmera';
                status.style.color = '#EF4444';
                status.style.animation = 'none';
            }
        });
}

function buscarProdutoPorCodigo(codigo) {
    if (!codigo || codigo.trim() === '') {
        alert('Digite um código de barras válido');
        return;
    }
    
    const produto = produtos.find(p => p.codigo === codigo);
    const resultadoDiv = document.getElementById('scannerResultOverlay');
    const resultadoNome = document.getElementById('scannerProdutoNome');
    const resultadoCodigo = document.getElementById('scannerProdutoCodigo');
    
    if (resultadoDiv && resultadoNome && resultadoCodigo) {
        if (produto) {
            resultadoNome.textContent = `✅ ${produto.nome}`;
            resultadoCodigo.textContent = `Código: ${produto.codigo}`;
            resultadoDiv.style.display = 'flex';
            resultadoDiv.style.background = 'rgba(16, 185, 129, 0.95)';
            
            setTimeout(() => {
                closeScannerModal();
                // Preencher o campo de código no formulário se estiver aberto
                const codigoInput = document.getElementById('produtoCodigo');
                if (codigoInput) codigoInput.value = produto.codigo;
                alert(`Produto encontrado: ${produto.nome}`);
            }, 1500);
        } else {
            resultadoNome.textContent = '❌ Produto não encontrado!';
            resultadoCodigo.textContent = `Código: ${codigo}`;
            resultadoDiv.style.display = 'flex';
            resultadoDiv.style.background = 'rgba(239, 68, 68, 0.95)';
            
            setTimeout(() => {
                resultadoDiv.style.display = 'none';
            }, 3000);
        }
    }
}

// ============================================
// PRODUTO MODAL
// ============================================

function openProdutoModal(produtoId = null) {
    const modal = document.getElementById('produtoModal');
    const title = document.getElementById('produtoModalTitle');
    const form = document.getElementById('produtoForm');
    
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
            form.dataset.editId = produtoId;
        }
    } else {
        title.textContent = '➕ Novo Produto';
        form.reset();
        document.getElementById('produtoPrecoKilo').value = '';
        document.getElementById('produtoEstoque').value = '0';
        document.getElementById('produtoEstoqueMinimo').value = '5';
        form.dataset.editId = '';
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
    const form = document.getElementById('produtoForm');
    const editId = form.dataset.editId;
    
    const produto = {
        id: editId || generateId(),
        nome: document.getElementById('produtoNome').value,
        codigo: document.getElementById('produtoCodigo').value || generateId(),
        categoria: document.getElementById('produtoCategoria').value,
        preco: parseFloat(document.getElementById('produtoPreco').value) || 0,
        precoKilo: parseFloat(document.getElementById('produtoPrecoKilo').value) || null,
        estoque: parseInt(document.getElementById('produtoEstoque').value) || 0,
        estoqueMinimo: parseInt(document.getElementById('produtoEstoqueMinimo').value) || 5,
        fornecedor: document.getElementById('produtoFornecedor').value,
        foto: null
    };
    
    if (editId) {
        const index = produtos.findIndex(p => p.id === editId);
        if (index !== -1) produtos[index] = produto;
    } else {
        produtos.push(produto);
    }
    
    produtosFiltrados = [...produtos];
    loadEstoqueData();
    loadProdutosTable();
    closeProdutoModal();
    
    alert(editId ? 'Produto atualizado!' : 'Produto adicionado!');
}

// ============================================
// VENDA POR KILO
// ============================================

function openVendaKiloModal(produtoId) {
    const produto = produtos.find(p => p.id === produtoId);
    if (!produto || !produto.precoKilo) return;
    
    document.getElementById('produtoKiloNome').textContent = produto.nome;
    document.getElementById('valorKilo').value = formatCurrency(produto.precoKilo);
    document.getElementById('quantidadeKilo').value = '1';
    document.getElementById('ajustarEstoqueModal').dataset.produtoId = produtoId;
    
    calcularTotalKilo();
    document.getElementById('ajustarEstoqueModal').style.display = 'flex';
}

function calcularTotalKilo() {
    const quantidade = parseFloat(document.getElementById('quantidadeKilo')?.value) || 0;
    const valorKiloTexto = document.getElementById('valorKilo')?.value || 'R$ 0,00';
    const valorKilo = parseFloat(valorKiloTexto.replace('R$', '').replace(/\./g, '').replace(',', '.')) || 0;
    const total = quantidade * valorKilo;
    document.getElementById('totalVendaKilo').textContent = formatCurrency(total);
}

function confirmarVendaKilo() {
    const produtoId = document.getElementById('ajustarEstoqueModal').dataset.produtoId;
    const produto = produtos.find(p => p.id === produtoId);
    const quantidade = parseFloat(document.getElementById('quantidadeKilo')?.value) || 0;
    
    if (!produto || quantidade <= 0) {
        alert('Quantidade inválida');
        return;
    }
    
    if (produto.estoque < quantidade) {
        alert(`Estoque insuficiente. Disponível: ${produto.estoque} kg`);
        return;
    }
    
    produto.estoque -= quantidade;
    produtosFiltrados = [...produtos];
    loadEstoqueData();
    loadProdutosTable();
    closeVendaKiloModal();
    
    alert(`Venda registrada: ${quantidade}kg de ${produto.nome}`);
}

function closeVendaKiloModal() {
    document.getElementById('ajustarEstoqueModal').style.display = 'none';
}