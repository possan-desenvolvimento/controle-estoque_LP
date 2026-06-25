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
let cameraFacing = 'environment'; // ALTERADO: agora começa com 'environment' (traseira)
let cameras = [];
let currentCameraIndex = 0;

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
// SCANNER OVERLAY - FUNÇÕES COMPLETAS COM ALTERNÂNCIA DE CÂMERA
// ============================================

function listarCameras() {
    const switchBtn = document.getElementById('switchCameraBtn');
    
    // Mostrar o botão SEMPRE
    if (switchBtn) {
        switchBtn.style.display = 'flex';
        switchBtn.textContent = '🔄';
        switchBtn.title = 'Alternar câmera (frente/traseira)';
        // Remover eventos antigos e adicionar novo
        const newSwitchBtn = switchBtn.cloneNode(true);
        switchBtn.parentNode.replaceChild(newSwitchBtn, switchBtn);
        newSwitchBtn.addEventListener('click', switchCamera);
    }
    
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        console.warn('enumerateDevices não suportado');
        return;
    }
    
    navigator.mediaDevices.enumerateDevices()
        .then(devices => {
            const videoDevices = devices.filter(d => d.kind === 'videoinput');
            cameras = videoDevices;
            
            console.log(`📷 ${cameras.length} câmera(s) encontrada(s)`);
            
            // Tenta encontrar a câmera traseira primeiro
            const hasEnvironment = cameras.some(c => 
                c.label.toLowerCase().includes('back') || 
                c.label.toLowerCase().includes('traseira') ||
                c.label.toLowerCase().includes('environment') ||
                c.label.toLowerCase().includes('câmera traseira')
            );
            
            if (hasEnvironment) {
                const envIndex = cameras.findIndex(c => 
                    c.label.toLowerCase().includes('back') || 
                    c.label.toLowerCase().includes('traseira') ||
                    c.label.toLowerCase().includes('environment') ||
                    c.label.toLowerCase().includes('câmera traseira')
                );
                currentCameraIndex = envIndex >= 0 ? envIndex : 0;
                cameraFacing = 'environment';
                console.log('📸 Câmera traseira selecionada');
            } else {
                // Se não encontrar traseira, usa a primeira disponível
                currentCameraIndex = 0;
                cameraFacing = 'environment'; // Mantém environment como fallback
                console.log('📸 Nenhuma câmera traseira encontrada, usando a primeira disponível');
            }
        })
        .catch(err => {
            console.warn('Erro ao listar câmeras:', err);
        });
}

function switchCamera() {
    const switchBtn = document.getElementById('switchCameraBtn');
    
    if (cameras.length === 0) {
        listarCameras();
        setTimeout(() => {
            if (cameras.length > 0) {
                switchCamera();
            } else {
                alert('Nenhuma câmera disponível para alternar');
            }
        }, 500);
        return;
    }
    
    currentCameraIndex = (currentCameraIndex + 1) % cameras.length;
    
    // Atualiza o facingMode baseado no índice
    const cameraLabel = cameras[currentCameraIndex]?.label || '';
    if (cameraLabel.toLowerCase().includes('back') || 
        cameraLabel.toLowerCase().includes('traseira') ||
        cameraLabel.toLowerCase().includes('environment')) {
        cameraFacing = 'environment';
    } else {
        cameraFacing = 'user';
    }
    
    if (switchBtn) {
        switchBtn.style.transform = 'rotate(180deg)';
        setTimeout(() => {
            switchBtn.style.transform = 'rotate(0deg)';
        }, 300);
    }
    
    console.log(`🔄 Alternando para câmera ${currentCameraIndex + 1}/${cameras.length} (${cameraFacing})`);
    
    if (scannerAtivo && scannerStream) {
        scannerStream.getTracks().forEach(track => track.stop());
        scannerStream = null;
        ativarCameraEspecifica(currentCameraIndex);
    } else {
        ativarCameraEspecifica(currentCameraIndex);
    }
}

function ativarCameraEspecifica(cameraIndex) {
    const video = document.getElementById('scannerVideo');
    const placeholder = document.getElementById('scannerPlaceholder');
    const status = document.getElementById('scannerStatus');
    
    if (!video) return;
    
    if (placeholder) {
        placeholder.innerHTML = `
            <div class="scanner-loading">
                <span>⏳</span>
                <p>${cameras.length > 0 ? 'Ativando câmera...' : 'Aguardando câmera...'}</p>
                <div class="spinner"></div>
            </div>
        `;
    }
    
    if (status) {
        status.textContent = cameras.length > 0 ? 'Ativando câmera...' : 'Aguardando câmera...';
        status.style.color = '#F59E0B';
    }
    
    // Se não tem câmeras, tenta listar
    if (cameras.length === 0) {
        listarCameras();
        setTimeout(() => {
            if (cameras.length === 0) {
                if (placeholder) {
                    placeholder.innerHTML = `
                        <span>❌</span>
                        <p>Nenhuma câmera encontrada</p>
                        <p style="font-size:12px;color:#6B7280;">Use o campo manual abaixo</p>
                    `;
                }
                if (status) {
                    status.textContent = 'Nenhuma câmera';
                    status.style.color = '#EF4444';
                }
                return;
            }
            ativarCameraEspecifica(currentCameraIndex);
        }, 500);
        return;
    }
    
    // Construir constraints com facingMode explícito
    const constraints = {
        video: {
            facingMode: cameraFacing, // Usa environment (traseira) por padrão
            width: { ideal: 1280 },
            height: { ideal: 720 }
        }
    };
    
    // Se tiver deviceId específico, usa ele
    if (cameras[cameraIndex]?.deviceId) {
        constraints.video.deviceId = { exact: cameras[cameraIndex].deviceId };
    }
    
    console.log('📷 Iniciando câmera com:', constraints);
    
    navigator.mediaDevices.getUserMedia(constraints)
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
            
            if (scannerTimeout) clearTimeout(scannerTimeout);
            
            // Removido o timeout de demonstração para não ficar buscando produto automaticamente
        })
        .catch(err => {
            console.error('Erro ao acessar câmera:', err);
            
            let mensagem = '';
            if (err.name === 'NotAllowedError') {
                mensagem = 'Permissão negada. Permita o acesso à câmera.';
            } else if (err.name === 'NotFoundError') {
                mensagem = 'Câmera não encontrada. Tente outra.';
            } else if (err.name === 'OverconstrainedError') {
                mensagem = 'Não foi possível usar a câmera traseira. Tentando com a câmera padrão...';
                // Tenta novamente sem facingMode
                console.log('Tentando sem facingMode...');
                navigator.mediaDevices.getUserMedia({ video: true })
                    .then(stream => {
                        scannerStream = stream;
                        video.srcObject = stream;
                        video.style.display = 'block';
                        if (placeholder) placeholder.style.display = 'none';
                        scannerAtivo = true;
                        if (status) {
                            status.textContent = 'Câmera padrão ativada';
                            status.style.color = '#22c55e';
                        }
                    })
                    .catch(err2 => {
                        mensagem = 'Erro ao acessar qualquer câmera. Verifique as permissões.';
                        showCameraError(mensagem, placeholder, status);
                    });
                return;
            } else {
                mensagem = err.message || 'Erro ao acessar a câmera.';
            }
            
            showCameraError(mensagem, placeholder, status);
        });
}

function showCameraError(mensagem, placeholder, status) {
    if (placeholder) {
        placeholder.innerHTML = `
            <span>❌</span>
            <p>${mensagem}</p>
            <p style="font-size:12px;color:#6B7280;">Use o campo manual abaixo</p>
            <button class="btn-primary" onclick="ativarScanner()" style="margin-top:12px;">Tentar novamente</button>
        `;
    }
    
    if (status) {
        status.textContent = 'Erro na câmera';
        status.style.color = '#EF4444';
        status.style.animation = 'none';
    }
}

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
    
    // Garantir que o botão de alternar apareça
    const switchBtn = document.getElementById('switchCameraBtn');
    if (switchBtn) {
        switchBtn.style.display = 'flex';
        switchBtn.textContent = '🔄';
        switchBtn.title = 'Alternar câmera (frente/traseira)';
        const newSwitchBtn = switchBtn.cloneNode(true);
        switchBtn.parentNode.replaceChild(newSwitchBtn, switchBtn);
        newSwitchBtn.addEventListener('click', switchCamera);
    }
    
    listarCameras();
}

function ativarScanner() {
    const video = document.getElementById('scannerVideo');
    const placeholder = document.getElementById('scannerPlaceholder');
    const status = document.getElementById('scannerStatus');
    const switchBtn = document.getElementById('switchCameraBtn');
    
    if (!video) return;
    
    // Garantir que o botão apareça
    if (switchBtn) {
        switchBtn.style.display = 'flex';
        switchBtn.textContent = '🔄';
        switchBtn.title = 'Alternar câmera (frente/traseira)';
        const newSwitchBtn = switchBtn.cloneNode(true);
        switchBtn.parentNode.replaceChild(newSwitchBtn, switchBtn);
        newSwitchBtn.addEventListener('click', switchCamera);
    }
    
    // Se não tiver câmeras listadas, lista agora
    if (cameras.length === 0) {
        listarCameras();
        setTimeout(() => {
            if (cameras.length === 0) {
                if (placeholder) {
                    placeholder.innerHTML = `
                        <span>❌</span>
                        <p>Nenhuma câmera encontrada</p>
                        <p style="font-size:12px;color:#6B7280;">Conecte uma câmera e tente novamente</p>
                    `;
                }
                return;
            }
            ativarCameraEspecifica(currentCameraIndex);
        }, 500);
        return;
    }
    
    ativarCameraEspecifica(currentCameraIndex);
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

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

function initPage() {
    // Função placeholder para compatibilidade
}