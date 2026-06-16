// ============================================
// VENDAS.JS - PDV MODERNÃO
// ============================================

let carrinho = [];
let clienteAtual = null;
let desconto = { valor: 0, tipo: 'fixo' };
let numeroVenda = 1;
let categoriaAtual = 'todos';

// Scanner
let scannerAtivoPDV = false;
let scannerStreamPDV = null;
let scannerTimeoutPDV = null;
let cameraFacingPDV = 'environment';
let camerasPDV = [];
let currentCameraIndexPDV = 0;

// Produtos mock
const produtosEstoque = [
    { id: '1', nome: 'Ração Premium Cães', codigo: '7891234567890', categoria: 'racao', preco: 89.90, precoKilo: 29.90, estoque: 15 },
    { id: '2', nome: 'Brinquedo Mordedor', codigo: '7891234567891', categoria: 'brinquedos', preco: 25.90, precoKilo: null, estoque: 8 },
    { id: '3', nome: 'Vermífugo Cães', codigo: '7891234567892', categoria: 'remedios', preco: 45.50, precoKilo: null, estoque: 3 },
    { id: '4', nome: 'Casinha Pet', codigo: '7891234567893', categoria: 'casinhas', preco: 299.90, precoKilo: null, estoque: 2 },
    { id: '5', nome: 'Ração Gatos Premium', codigo: '7891234567894', categoria: 'racao', preco: 79.90, precoKilo: 26.90, estoque: 10 }
];

let produtosFiltrados = [...produtosEstoque];

document.addEventListener('DOMContentLoaded', () => {
    initPage();
    document.getElementById('vendaNumero').textContent = String(numeroVenda).padStart(4, '0');
    document.getElementById('vendaData').textContent = new Date().toLocaleDateString('pt-BR');
    
    setupEventListeners();
    loadProdutosGrid();
    atualizarCarrinho();
});

function setupEventListeners() {
    // Busca produtos
    document.getElementById('buscaProdutoPDV').addEventListener('input', filtrarProdutos);
    
    // Categorias
    document.querySelectorAll('.cat-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            categoriaAtual = btn.dataset.cat;
            filtrarProdutos();
        });
    });
    
    // Ações rápidas
    document.getElementById('pdvBtnEscanear').addEventListener('click', openScannerPDV);
    document.getElementById('pdvBtnCliente').addEventListener('click', openSelecionarClienteModal);
    document.getElementById('pdvBtnDesconto').addEventListener('click', () => {
        document.getElementById('pdvDescontoValor').focus();
    });
    document.getElementById('pdvBtnCancelar').addEventListener('click', () => {
        if (carrinho.length > 0 && confirm('Cancelar esta venda?')) novaVenda();
        else novaVenda();
    });
    
    // Nova Venda
    document.getElementById('novaVendaBtn').addEventListener('click', novaVenda);
    document.getElementById('cancelarVendaBtn').addEventListener('click', () => {
        if (carrinho.length > 0 && confirm('Cancelar esta venda?')) novaVenda();
        else novaVenda();
    });
    
    // Desconto
    document.getElementById('pdvDescontoValor').addEventListener('input', () => {
        desconto.valor = parseFloat(document.getElementById('pdvDescontoValor').value) || 0;
        desconto.tipo = document.getElementById('pdvDescontoTipo').value;
        atualizarCarrinho();
    });
    document.getElementById('pdvDescontoTipo').addEventListener('change', () => {
        desconto.tipo = document.getElementById('pdvDescontoTipo').value;
        atualizarCarrinho();
    });
    
    // Selecionar cliente
    document.getElementById('pdvSelecionarCliente').addEventListener('click', openSelecionarClienteModal);
    
    // Finalizar venda
    document.getElementById('pdvFinalizarVenda').addEventListener('click', openFinalizarVendaModal);
    
    // Scanner overlay
    document.getElementById('ativarScannerPDVBtn').addEventListener('click', ativarScannerPDV);
    document.getElementById('closeScannerPDVBtn').addEventListener('click', closeScannerPDV);
    document.getElementById('cancelarScannerPDVBtn').addEventListener('click', closeScannerPDV);
    document.getElementById('buscarCodigoPDVBtn').addEventListener('click', () => {
        const codigo = document.getElementById('codigoManualPDV').value;
        if (codigo) buscarProdutoPorCodigoPDV(codigo);
        document.getElementById('codigoManualPDV').value = '';
    });
    document.getElementById('codigoManualPDV').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const codigo = document.getElementById('codigoManualPDV').value;
            if (codigo) buscarProdutoPorCodigoPDV(codigo);
            document.getElementById('codigoManualPDV').value = '';
        }
    });
    
    // Botão alternar câmera
    const switchBtn = document.getElementById('switchCameraPDVBtn');
    if (switchBtn) {
        switchBtn.addEventListener('click', switchCameraPDV);
    }
    
    // Modais
    setupModalEvents();
}

function filtrarProdutos() {
    const search = document.getElementById('buscaProdutoPDV').value.toLowerCase();
    produtosFiltrados = produtosEstoque.filter(p => {
        const matchSearch = p.nome.toLowerCase().includes(search) || p.codigo.includes(search);
        const matchCategoria = categoriaAtual === 'todos' || p.categoria === categoriaAtual;
        return matchSearch && matchCategoria;
    });
    loadProdutosGrid();
}

function loadProdutosGrid() {
    const grid = document.getElementById('pdvProdutosGrid');
    if (!grid) return;
    
    if (produtosFiltrados.length === 0) {
        grid.innerHTML = '<div class="pdv-loading">Nenhum produto encontrado</div>';
        return;
    }
    
    grid.innerHTML = produtosFiltrados.map(p => `
        <div class="pdv-produto-item" data-id="${p.id}">
            <span class="produto-emoji">${p.categoria === 'racao' ? '🐶' : p.categoria === 'remedios' ? '💊' : p.categoria === 'brinquedos' ? '🎾' : p.categoria === 'casinhas' ? '🏠' : '🎀'}</span>
            <div class="produto-nome">${p.nome}</div>
            <div class="produto-preco">${formatCurrency(p.preco)}</div>
            ${p.precoKilo ? `<div class="produto-kilo">${formatCurrency(p.precoKilo)}/kg</div>` : ''}
        </div>
    `).join('');
    
    document.querySelectorAll('.pdv-produto-item').forEach(el => {
        el.addEventListener('click', () => {
            const produto = produtosEstoque.find(p => p.id === el.dataset.id);
            if (produto) adicionarAoCarrinho(produto);
        });
    });
}

// ============================================
// SCANNER OVERLAY - FUNÇÕES COMPLETAS COM ALTERNÂNCIA DE CÂMERA
// ============================================

function listarCamerasPDV() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;
    
    navigator.mediaDevices.enumerateDevices()
        .then(devices => {
            const videoDevices = devices.filter(d => d.kind === 'videoinput');
            camerasPDV = videoDevices;
            
            const switchBtn = document.getElementById('switchCameraPDVBtn');
            if (switchBtn) {
                if (camerasPDV.length > 1) {
                    switchBtn.style.display = 'flex';
                    switchBtn.textContent = '🔄';
                } else {
                    switchBtn.style.display = 'none';
                }
            }
            
            const hasEnvironment = camerasPDV.some(c => 
                c.label.toLowerCase().includes('back') || 
                c.label.toLowerCase().includes('traseira') ||
                c.label.toLowerCase().includes('environment')
            );
            
            if (hasEnvironment) {
                const envIndex = camerasPDV.findIndex(c => 
                    c.label.toLowerCase().includes('back') || 
                    c.label.toLowerCase().includes('traseira') ||
                    c.label.toLowerCase().includes('environment')
                );
                currentCameraIndexPDV = envIndex >= 0 ? envIndex : 0;
                cameraFacingPDV = 'environment';
            } else {
                currentCameraIndexPDV = 0;
                cameraFacingPDV = 'user';
            }
        })
        .catch(err => console.warn('Erro ao listar câmeras:', err));
}

function switchCameraPDV() {
    if (camerasPDV.length <= 1) return;
    
    currentCameraIndexPDV = (currentCameraIndexPDV + 1) % camerasPDV.length;
    
    if (scannerAtivoPDV && scannerStreamPDV) {
        scannerStreamPDV.getTracks().forEach(track => track.stop());
        scannerStreamPDV = null;
        ativarCameraEspecificaPDV(currentCameraIndexPDV);
    }
    
    const switchBtn = document.getElementById('switchCameraPDVBtn');
    if (switchBtn) {
        switchBtn.textContent = '🔄';
        switchBtn.style.transform = 'rotate(0deg)';
    }
}

function ativarCameraEspecificaPDV(cameraIndex) {
    const video = document.getElementById('scannerVideoPDV');
    const placeholder = document.getElementById('scannerPlaceholderPDV');
    const status = document.getElementById('scannerStatusPDV');
    
    if (!video) return;
    
    if (placeholder) {
        placeholder.innerHTML = `
            <div class="scanner-loading">
                <span>⏳</span>
                <p>Alternando câmera...</p>
                <div class="spinner"></div>
            </div>
        `;
    }
    
    if (status) {
        status.textContent = 'Alternando câmera...';
        status.style.color = '#F59E0B';
    }
    
    const constraints = {
        video: {
            deviceId: camerasPDV[cameraIndex]?.deviceId ? { exact: camerasPDV[cameraIndex].deviceId } : undefined,
            facingMode: cameraFacingPDV
        }
    };
    
    navigator.mediaDevices.getUserMedia(constraints)
        .then(stream => {
            scannerStreamPDV = stream;
            video.srcObject = stream;
            video.style.display = 'block';
            if (placeholder) placeholder.style.display = 'none';
            scannerAtivoPDV = true;
            
            if (status) {
                status.textContent = 'Aproxime o código';
                status.style.color = '#22c55e';
                status.style.animation = 'scannerPulse 1.5s ease-in-out infinite';
            }
            
            if (scannerTimeoutPDV) clearTimeout(scannerTimeoutPDV);
            
            scannerTimeoutPDV = setTimeout(() => {
                if (scannerAtivoPDV) {
                    buscarProdutoPorCodigoPDV('7891234567890');
                }
            }, 5000);
        })
        .catch(err => {
            console.error('Erro ao acessar câmera específica:', err);
            
            let mensagem = '';
            if (err.name === 'NotAllowedError') {
                mensagem = 'Permissão negada. Permita o acesso à câmera.';
            } else if (err.name === 'NotFoundError') {
                mensagem = 'Câmera não encontrada. Tente outra.';
            } else {
                mensagem = err.message || 'Erro ao acessar a câmera.';
            }
            
            if (placeholder) {
                placeholder.innerHTML = `
                    <span>❌</span>
                    <p>${mensagem}</p>
                    <p style="font-size:12px;color:#6B7280;">Use o campo manual abaixo</p>
                    <button class="btn-primary" onclick="ativarScannerPDV()" style="margin-top:12px;">Tentar novamente</button>
                `;
            }
            
            if (status) {
                status.textContent = 'Erro na câmera';
                status.style.color = '#EF4444';
                status.style.animation = 'none';
            }
        });
}

function openScannerPDV() {
    const modal = document.getElementById('scannerModalPDV');
    if (!modal) return;
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    const resultado = document.getElementById('scannerResultPDV');
    if (resultado) resultado.style.display = 'none';
    
    const placeholder = document.getElementById('scannerPlaceholderPDV');
    if (placeholder) {
        placeholder.style.display = 'flex';
        placeholder.innerHTML = `
            <span>📷</span>
            <p>Clique para ativar a câmera</p>
            <button class="btn-primary" id="ativarScannerPDVBtn">Ativar Scanner</button>
        `;
        document.getElementById('ativarScannerPDVBtn')?.addEventListener('click', ativarScannerPDV);
    }
    
    const video = document.getElementById('scannerVideoPDV');
    if (video) {
        video.style.display = 'none';
        video.srcObject = null;
    }
    
    const status = document.getElementById('scannerStatusPDV');
    if (status) {
        status.textContent = 'Clique em "Ativar Scanner"';
        status.style.color = '#9CA3AF';
        status.style.animation = 'none';
    }
    
    const switchBtn = document.getElementById('switchCameraPDVBtn');
    if (switchBtn) {
        switchBtn.style.display = 'none';
        switchBtn.textContent = '🔄';
    }
    
    listarCamerasPDV();
}

function ativarScannerPDV() {
    const video = document.getElementById('scannerVideoPDV');
    const placeholder = document.getElementById('scannerPlaceholderPDV');
    const status = document.getElementById('scannerStatusPDV');
    const switchBtn = document.getElementById('switchCameraPDVBtn');
    
    if (!video) return;
    
    if (camerasPDV.length === 0) {
        listarCamerasPDV();
        setTimeout(() => {
            if (camerasPDV.length === 0) {
                if (placeholder) {
                    placeholder.innerHTML = `
                        <span>❌</span>
                        <p>Nenhuma câmera encontrada</p>
                        <p style="font-size:12px;color:#6B7280;">Conecte uma câmera e tente novamente</p>
                    `;
                }
                return;
            }
            ativarCameraEspecificaPDV(currentCameraIndexPDV);
        }, 500);
        return;
    }
    
    if (switchBtn && camerasPDV.length > 1) {
        switchBtn.style.display = 'flex';
        switchBtn.textContent = '🔄';
        const newSwitchBtn = switchBtn.cloneNode(true);
        switchBtn.parentNode.replaceChild(newSwitchBtn, switchBtn);
        newSwitchBtn.addEventListener('click', switchCameraPDV);
    }
    
    ativarCameraEspecificaPDV(currentCameraIndexPDV);
}

function closeScannerPDV() {
    const modal = document.getElementById('scannerModalPDV');
    if (!modal) return;
    
    if (scannerStreamPDV) {
        scannerStreamPDV.getTracks().forEach(t => t.stop());
        scannerStreamPDV = null;
    }
    scannerAtivoPDV = false;
    if (scannerTimeoutPDV) clearTimeout(scannerTimeoutPDV);
    
    const video = document.getElementById('scannerVideoPDV');
    if (video) {
        video.srcObject = null;
        video.style.display = 'none';
    }
    
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

function buscarProdutoPorCodigoPDV(codigo) {
    if (!codigo || codigo.trim() === '') return;
    
    const produto = produtosEstoque.find(p => p.codigo === codigo);
    const resultado = document.getElementById('scannerResultPDV');
    const nome = document.getElementById('scannerProdutoNomePDV');
    const cod = document.getElementById('scannerProdutoCodigoPDV');
    
    if (resultado && nome && cod) {
        if (produto) {
            nome.textContent = `✅ ${produto.nome}`;
            cod.textContent = `Código: ${produto.codigo}`;
            resultado.style.display = 'flex';
            resultado.style.background = 'rgba(16, 185, 129, 0.95)';
            
            setTimeout(() => {
                closeScannerPDV();
                adicionarAoCarrinho(produto);
            }, 1500);
        } else {
            nome.textContent = '❌ Produto não encontrado!';
            cod.textContent = `Código: ${codigo}`;
            resultado.style.display = 'flex';
            resultado.style.background = 'rgba(239, 68, 68, 0.95)';
            setTimeout(() => { resultado.style.display = 'none'; }, 3000);
        }
    }
}

// ============================================
// CARRINHO
// ============================================

function adicionarAoCarrinho(produto) {
    if (produto.precoKilo) {
        openKiloModal(produto);
        return;
    }
    
    const existente = carrinho.find(i => i.id === produto.id);
    if (existente) {
        existente.quantidade++;
        existente.subtotal = existente.quantidade * existente.preco;
    } else {
        carrinho.push({ ...produto, quantidade: 1, subtotal: produto.preco, isKilo: false });
    }
    atualizarCarrinho();
}

function openKiloModal(produto) {
    const modal = document.getElementById('pdvKiloModal');
    if (!modal) return;
    
    document.getElementById('pdvKiloNome').textContent = produto.nome;
    document.getElementById('pdvKiloPreco').textContent = formatCurrency(produto.precoKilo) + '/kg';
    document.getElementById('pdvKiloQuantidade').value = '1';
    modal.dataset.produtoId = produto.id;
    modal.dataset.produtoPrecoKilo = produto.precoKilo;
    
    calcularKiloSubtotal(produto.precoKilo);
    modal.style.display = 'flex';
}

function calcularKiloSubtotal(precoKilo) {
    const qtd = parseFloat(document.getElementById('pdvKiloQuantidade').value) || 0;
    document.getElementById('pdvKiloSubtotal').textContent = formatCurrency(qtd * precoKilo);
}

function confirmarKilo() {
    const modal = document.getElementById('pdvKiloModal');
    const produto = produtosEstoque.find(p => p.id === modal.dataset.produtoId);
    if (!produto) return;
    
    const qtd = parseFloat(document.getElementById('pdvKiloQuantidade').value) || 0;
    const subtotal = qtd * parseFloat(modal.dataset.produtoPrecoKilo);
    
    const existente = carrinho.find(i => i.id === produto.id);
    if (existente) {
        existente.quantidade += qtd;
        existente.subtotal = existente.quantidade * existente.preco;
    } else {
        carrinho.push({ ...produto, quantidade: qtd, subtotal: subtotal, isKilo: true, unidade: 'kg' });
    }
    
    atualizarCarrinho();
    modal.style.display = 'none';
}

function atualizarCarrinho() {
    const lista = document.getElementById('pdvCarrinhoLista');
    const count = document.getElementById('pdvItensCount');
    const subtotalEl = document.getElementById('pdvSubtotal');
    const totalEl = document.getElementById('pdvTotal');
    
    const subtotal = carrinho.reduce((acc, i) => acc + i.subtotal, 0);
    let total = subtotal;
    if (desconto.tipo === 'fixo') total = subtotal - desconto.valor;
    else if (desconto.tipo === 'percent') total = subtotal * (1 - desconto.valor / 100);
    total = Math.max(total, 0);
    
    if (subtotalEl) subtotalEl.textContent = formatCurrency(subtotal);
    if (totalEl) totalEl.textContent = formatCurrency(total);
    if (count) count.textContent = `${carrinho.reduce((acc, i) => acc + i.quantidade, 0)} itens`;
    
    if (!lista) return;
    
    if (carrinho.length === 0) {
        lista.innerHTML = `
            <div class="carrinho-vazio">
                <span>🛒</span>
                <p>Carrinho vazio</p>
                <small>Escaneie ou clique em um produto</small>
            </div>
        `;
        return;
    }
    
    lista.innerHTML = carrinho.map((item, idx) => `
        <div class="carrinho-item">
            <span class="item-emoji">${item.isKilo ? '⚖️' : '📦'}</span>
            <div class="item-info">
                <div class="item-nome">${item.nome}</div>
                <div class="item-preco">${formatCurrency(item.preco)}${item.isKilo ? '/kg' : ''}</div>
            </div>
            <div class="item-qtd">
                <button class="qtd-btn" data-idx="${idx}" data-delta="-1">−</button>
                <span class="qtd-valor">${item.quantidade}${item.isKilo ? 'kg' : ''}</span>
                <button class="qtd-btn" data-idx="${idx}" data-delta="1">+</button>
            </div>
            <div class="item-subtotal">${formatCurrency(item.subtotal)}</div>
            <button class="item-remove" data-idx="${idx}">✕</button>
        </div>
    `).join('');
    
    document.querySelectorAll('.qtd-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const idx = parseInt(btn.dataset.idx);
            const delta = parseInt(btn.dataset.delta);
            alterarQuantidade(idx, delta);
        });
    });
    document.querySelectorAll('.item-remove').forEach(btn => {
        btn.addEventListener('click', () => {
            const idx = parseInt(btn.dataset.idx);
            carrinho.splice(idx, 1);
            atualizarCarrinho();
        });
    });
}

function alterarQuantidade(idx, delta) {
    if (!carrinho[idx]) return;
    const nova = carrinho[idx].quantidade + delta;
    if (nova <= 0) { carrinho.splice(idx, 1); }
    else { carrinho[idx].quantidade = nova; carrinho[idx].subtotal = nova * carrinho[idx].preco; }
    atualizarCarrinho();
}

// ============================================
// CLIENTE
// ============================================

function openSelecionarClienteModal() {
    const modal = document.getElementById('pdvClienteModal');
    if (!modal) return;
    
    const clientesMock = [
        { id: '1', nome: 'João Silva', telefone: '(11) 99999-9999' },
        { id: '2', nome: 'Maria Oliveira', telefone: '(11) 98888-8888' }
    ];
    
    const lista = document.getElementById('pdvClientesLista');
    if (lista) {
        lista.innerHTML = clientesMock.map(c => `
            <div class="cliente-modal-item" data-id="${c.id}" data-nome="${c.nome}">
                <div><strong>${c.nome}</strong><br><small>${c.telefone}</small></div>
                <span>➕</span>
            </div>
        `).join('');
        
        document.querySelectorAll('.cliente-modal-item').forEach(el => {
            el.addEventListener('click', () => {
                clienteAtual = { id: el.dataset.id, nome: el.dataset.nome };
                document.getElementById('pdvClienteNome').textContent = clienteAtual.nome;
                modal.style.display = 'none';
            });
        });
    }
    
    document.getElementById('pdvClienteAvulsoBtn').addEventListener('click', () => {
        clienteAtual = null;
        document.getElementById('pdvClienteNome').textContent = 'Não informado';
        modal.style.display = 'none';
    });
    
    modal.style.display = 'flex';
}

// ============================================
// FINALIZAR
// ============================================

function openFinalizarVendaModal() {
    if (carrinho.length === 0) { alert('Carrinho vazio!'); return; }
    
    const modal = document.getElementById('pdvFinalizarModal');
    if (!modal) return;
    
    const subtotal = carrinho.reduce((acc, i) => acc + i.subtotal, 0);
    let total = subtotal;
    if (desconto.tipo === 'fixo') total = subtotal - desconto.valor;
    else if (desconto.tipo === 'percent') total = subtotal * (1 - desconto.valor / 100);
    total = Math.max(total, 0);
    
    document.getElementById('pdvFItens').textContent = carrinho.reduce((acc, i) => acc + i.quantidade, 0);
    document.getElementById('pdvFSubtotal').textContent = formatCurrency(subtotal);
    document.getElementById('pdvFDesconto').textContent = desconto.tipo === 'fixo' ? formatCurrency(desconto.valor) : `${desconto.valor}%`;
    document.getElementById('pdvFTotal').textContent = formatCurrency(total);
    
    modal.style.display = 'flex';
}

function confirmarFinalizar() {
    const formaPagamento = document.getElementById('pdvFormaPagamento').value;
    const totalTexto = document.getElementById('pdvFTotal').textContent;
    const total = parseFloat(totalTexto.replace('R$', '').replace(/\./g, '').replace(',', '.')) || 0;
    
    const venda = {
        id: generateId(),
        data: new Date().toISOString(),
        cliente: clienteAtual,
        itens: [...carrinho],
        subtotal: carrinho.reduce((acc, i) => acc + i.subtotal, 0),
        desconto: desconto,
        total: total,
        pagamento: formaPagamento,
        numero: numeroVenda
    };
    
    const vendas = JSON.parse(localStorage.getItem('vendas') || '[]');
    vendas.push(venda);
    localStorage.setItem('vendas', JSON.stringify(vendas));
    
    mostrarComprovante(venda);
    document.getElementById('pdvFinalizarModal').style.display = 'none';
}

function mostrarComprovante(venda) {
    const modal = document.getElementById('pdvComprovanteModal');
    const content = document.getElementById('pdvComprovanteContent');
    if (!modal || !content) return;
    
    content.innerHTML = `
        <div style="text-align:center;margin-bottom:16px;">
            <strong>📦 LP Automações</strong><br>
            <small>${formatDateTime(venda.data)}</small><br>
            <small>Venda #${String(venda.numero).padStart(4, '0')}</small>
        </div>
        <div style="border-top:1px dashed #ccc;margin:8px 0;"></div>
        ${venda.itens.map(i => `
            <div class="comprovante-linha">
                <span>${i.quantidade}${i.isKilo ? 'kg' : ''} x ${i.nome}</span>
                <span>${formatCurrency(i.subtotal)}</span>
            </div>
        `).join('')}
        <div style="border-top:1px dashed #ccc;margin:8px 0;"></div>
        <div class="comprovante-linha"><span>Subtotal:</span><span>${formatCurrency(venda.subtotal)}</span></div>
        <div class="comprovante-linha"><span>Desconto:</span><span>${venda.desconto.tipo === 'fixo' ? formatCurrency(venda.desconto.valor) : venda.desconto.valor + '%'}</span></div>
        <div class="comprovante-total"><span>TOTAL:</span><span>${formatCurrency(venda.total)}</span></div>
        <div style="border-top:1px dashed #ccc;margin:8px 0;"></div>
        <div class="comprovante-linha"><span>Pagamento:</span><span>${getFormaPagamentoNome(venda.pagamento)}</span></div>
        ${venda.cliente ? `<div class="comprovante-linha"><span>Cliente:</span><span>${venda.cliente.nome}</span></div>` : ''}
        <div style="text-align:center;margin-top:16px;"><small>Obrigado! 🐾</small></div>
    `;
    
    modal.style.display = 'flex';
}

function getFormaPagamentoNome(p) {
    const map = { dinheiro: 'Dinheiro', pix: 'PIX', debito: 'Débito', credito: 'Crédito' };
    return map[p] || p;
}

function novaVenda() {
    carrinho = [];
    clienteAtual = null;
    desconto = { valor: 0, tipo: 'fixo' };
    numeroVenda++;
    
    document.getElementById('vendaNumero').textContent = String(numeroVenda).padStart(4, '0');
    document.getElementById('pdvClienteNome').textContent = 'Não informado';
    document.getElementById('pdvDescontoValor').value = '0';
    document.getElementById('pdvDescontoTipo').value = 'fixo';
    document.getElementById('pdvFormaPagamento').value = 'dinheiro';
    document.getElementById('pdvTrocoGroup').style.display = 'none';
    atualizarCarrinho();
}

// ============================================
// MODAIS - EVENTOS
// ============================================

function setupModalEvents() {
    // Cliente
    document.getElementById('closePdvClienteBtn').addEventListener('click', () => {
        document.getElementById('pdvClienteModal').style.display = 'none';
    });
    document.getElementById('cancelarPdvClienteBtn').addEventListener('click', () => {
        document.getElementById('pdvClienteModal').style.display = 'none';
    });
    
    // Kilo
    document.getElementById('closePdvKiloBtn').addEventListener('click', () => {
        document.getElementById('pdvKiloModal').style.display = 'none';
    });
    document.getElementById('cancelarPdvKiloBtn').addEventListener('click', () => {
        document.getElementById('pdvKiloModal').style.display = 'none';
    });
    document.getElementById('confirmarPdvKiloBtn').addEventListener('click', confirmarKilo);
    document.getElementById('pdvKiloQuantidade').addEventListener('input', () => {
        const modal = document.getElementById('pdvKiloModal');
        const preco = parseFloat(modal.dataset.produtoPrecoKilo) || 0;
        calcularKiloSubtotal(preco);
    });
    
    // Finalizar
    document.getElementById('closePdvFinalizarBtn').addEventListener('click', () => {
        document.getElementById('pdvFinalizarModal').style.display = 'none';
    });
    document.getElementById('cancelarPdvFinalizarBtn').addEventListener('click', () => {
        document.getElementById('pdvFinalizarModal').style.display = 'none';
    });
    document.getElementById('confirmarPdvFinalizarBtn').addEventListener('click', confirmarFinalizar);
    
    // Pagamento - troco
    document.getElementById('pdvFormaPagamento').addEventListener('change', () => {
        const show = document.getElementById('pdvFormaPagamento').value === 'dinheiro';
        document.getElementById('pdvTrocoGroup').style.display = show ? 'block' : 'none';
    });
    document.getElementById('pdvValorRecebido').addEventListener('input', () => {
        const total = parseFloat(document.getElementById('pdvFTotal').textContent.replace('R$', '').replace(/\./g, '').replace(',', '.')) || 0;
        const recebido = parseFloat(document.getElementById('pdvValorRecebido').value) || 0;
        const troco = recebido - total;
        if (troco > 0) {
            document.getElementById('pdvTrocoInfo').style.display = 'flex';
            document.getElementById('pdvTrocoValor').textContent = formatCurrency(troco);
        } else {
            document.getElementById('pdvTrocoInfo').style.display = 'none';
        }
    });
    
    // Comprovante
    document.getElementById('closePdvComprovanteBtn').addEventListener('click', () => {
        document.getElementById('pdvComprovanteModal').style.display = 'none';
    });
    document.getElementById('imprimirPdvComprovanteBtn').addEventListener('click', () => window.print());
    document.getElementById('fecharPdvComprovanteBtn').addEventListener('click', () => {
        document.getElementById('pdvComprovanteModal').style.display = 'none';
        novaVenda();
    });
}