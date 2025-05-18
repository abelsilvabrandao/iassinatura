import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-auth.js";

// Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDydNISDfnggfMbymwO_wgcX5xGj0vM7kU",
    authDomain: "assinaturas-d4ef6.firebaseapp.com",
    projectId: "assinaturas-d4ef6",
    storageBucket: "assinaturas-d4ef6.firebasestorage.app",
    messagingSenderId: "923584022050",
    appId: "1:923584022050:web:14d438fe959c1db5d76c7b",
    measurementId: "G-9K5FMPWV7L"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let allSectors = [];
let allUnits = [];

// Função auxiliar para criar células da tabela
function createCell(content) {
    const td = document.createElement("td");
    td.textContent = content || "-";
    return td;
}

// Função para carregar unidades na lista
async function loadUnitsList() {
    const unitsList = document.getElementById("units-list");
    if (!unitsList) return;

    const tbody = unitsList.querySelector("tbody");
    tbody.innerHTML = ""; // Limpa a lista atual

    try {
        const querySnapshot = await getDocs(collection(db, "units"));
        allUnits = [];
        querySnapshot.forEach((doc) => {
            allUnits.push({ id: doc.id, ...doc.data() });
        });

        if (allUnits.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8">Nenhuma unidade cadastrada.</td></tr>';
            return;
        }

        renderUnitsTable(allUnits);
    } catch (error) {
        console.error("Erro ao carregar unidades:", error);
        tbody.innerHTML = '<tr><td colspan="8" class="error">Erro ao carregar unidades.</td></tr>';
    }
}

function renderUnitsTable(units) {
    const tbody = document.querySelector("#units-list tbody");
    tbody.innerHTML = "";

    units.forEach(unit => {
        const tr = document.createElement("tr");

        // Logo
        const logoCell = document.createElement("td");
        if (unit.image) {
            const img = document.createElement("img");
            img.src = unit.image;
            img.alt = unit.name;
            img.style.maxWidth = "80px";
            logoCell.appendChild(img);
        }
        tr.appendChild(logoCell);

        // Dados da unidade
        tr.appendChild(createCell(unit.name));
        tr.appendChild(createCell(unit.cnpj));
        tr.appendChild(createCell(`${unit.address}, ${unit.number}${unit.complement ? `, ${unit.complement}` : ''}, ${unit.neighborhood}, ${unit.city} - ${unit.state}`));
        tr.appendChild(createCell(unit.cep));
        tr.appendChild(createCell(unit.certifications ? unit.certifications.join(", ") : ""));
        tr.appendChild(createCell(unit.site));

        // Botões de ação
        const actionsCell = document.createElement("td");
        const actionsDiv = document.createElement("div");
        actionsDiv.className = "action-buttons";

        // Botão de editar
        const editButton = document.createElement("button");
        editButton.className = "btn-edit";
        editButton.innerHTML = '<i class="fas fa-edit"></i>';
        editButton.onclick = () => editUnit(unit.id, unit.name, unit.cnpj, unit.address, unit.number, unit.complement, unit.neighborhood, unit.city, unit.state, unit.phone, unit.cep);

        // Botão de excluir
        const deleteButton = document.createElement("button");
        deleteButton.className = "btn-delete";
        deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
        deleteButton.onclick = () => deleteUnit(unit.id);

        actionsDiv.appendChild(editButton);
        actionsDiv.appendChild(deleteButton);
        actionsCell.appendChild(actionsDiv);
        tr.appendChild(actionsCell);

        tbody.appendChild(tr);
    });
}


// Funções para Setores
async function loadSectorsList() {
    const sectorsContainer = document.getElementById('sectors-list');
    sectorsContainer.innerHTML = '<div class="loading">Carregando setores...</div>';

    try {
        const sectorsSnapshot = await getDocs(collection(db, 'sectors'));
        allSectors = [];
        sectorsSnapshot.forEach(doc => {
            allSectors.push({ id: doc.id, ...doc.data() });
        });

        if (allSectors.length === 0) {
            sectorsContainer.innerHTML = '<p>Nenhum setor cadastrado.</p>';
            return;
        }

        renderSectorsTable(allSectors);
    } catch (error) {
        console.error("Erro ao carregar setores:", error);
        sectorsContainer.innerHTML = '<p class="error">Erro ao carregar setores.</p>';
    }
}

function renderSectorsTable(sectors) {
    const sectorsContainer = document.getElementById('sectors-list');
    const table = document.createElement('table');
    table.innerHTML = `
        <thead>
            <tr>
                <th>Nome</th>
                <th>Descrição</th>
                <th>Ações</th>
            </tr>
        </thead>
        <tbody></tbody>
    `;

    const tbody = table.querySelector('tbody');
    sectors.forEach(sector => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${sector.name}</td>
            <td>${sector.description || '-'}</td>
            <td>
                <div class="action-buttons">
                    <button onclick="editSector('${sector.id}')" class="btn-edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteSector('${sector.id}')" class="btn-delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });

    sectorsContainer.innerHTML = '';
    sectorsContainer.appendChild(table);
}

function exportTableToExcel(tableId, filename = 'tabela.xlsx') {
  const table = document.getElementById(tableId);
  const wb = XLSX.utils.table_to_book(table, { sheet: "Sheet1" });
  XLSX.writeFile(wb, filename);
}
document.getElementById('download-excel-sectors-button').addEventListener('click', () => {
  exportTableToExcel('sectors-list', 'setores.xlsx');
});

document.getElementById('download-excel-button').addEventListener('click', () => {
  exportTableToExcel('units-list', 'unidades.xlsx');
});


async function handleSectorSubmit(event) {
    event.preventDefault();
    const name = document.getElementById('sector-name').value;
    const description = document.getElementById('sector-description').value;

    try {
        const sectorData = {
            name,
            description,
            createdAt: new Date().toISOString()
        };

        const editingId = document.getElementById('sector-form').dataset.editingId;
        
        if (editingId) {
            await updateDoc(doc(db, 'sectors', editingId), sectorData);
            Swal.fire('Sucesso!', 'Setor atualizado com sucesso.', 'success');
        } else {
            await addDoc(collection(db, 'sectors'), sectorData);
            Swal.fire('Sucesso!', 'Setor cadastrado com sucesso.', 'success');
        }

        document.getElementById('sector-modal').classList.add('hidden');
        loadSectorsList();
    } catch (error) {
        console.error("Erro ao salvar setor:", error);
        Swal.fire('Erro!', 'Erro ao salvar setor.', 'error');
    }
}

async function handleUnitSubmit(event) {
    event.preventDefault();

    // Coleta as certificações
    const certificationInputs = document.querySelectorAll('.certification');
    const certifications = Array.from(certificationInputs)
        .map(input => input.value)
        .filter(value => value);

    try {
        const unitData = {
            name: document.getElementById('unit-name').value,
            cnpj: document.getElementById('cnpj').value,
            cep: document.getElementById('unit-cep').value,
            address: document.getElementById('address').value,
            number: document.getElementById('unit-number').value,
            complement: document.getElementById('unit-complement').value,
            neighborhood: document.getElementById('unit-neighborhood').value,
            city: document.getElementById('unit-city').value,
            state: document.getElementById('unit-state').value,
            phone: document.getElementById('unit-phone').value,
            site: document.getElementById('unit-site').value,
            certifications: certifications,
            updatedAt: new Date().toISOString()
        };

        const imageFile = document.getElementById('unit-image').files[0];
        const editingId = document.getElementById('unit-form').dataset.editingId;

        if (editingId) {
            if (imageFile) {
                unitData.image = await convertToBase64(imageFile);
            } else {
                // Preserva a imagem existente
                const unitDoc = await getDoc(doc(db, 'units', editingId));
                if (unitDoc.exists()) {
                    unitData.image = unitDoc.data().image || null;
                }
            }
            await updateDoc(doc(db, 'units', editingId), unitData);
            Swal.fire('Sucesso!', 'Unidade atualizada com sucesso.', 'success');
        } else {
            if (imageFile) {
                unitData.image = await convertToBase64(imageFile);
            }
            unitData.createdAt = new Date().toISOString();
            await addDoc(collection(db, 'units'), unitData);
            Swal.fire('Sucesso!', 'Unidade cadastrada com sucesso.', 'success');
        }

        document.getElementById('unit-modal').classList.add('hidden');
        loadUnitsList();
    } catch (error) {
        console.error('Erro ao salvar unidade:', error);
        Swal.fire('Erro!', 'Erro ao salvar unidade.', 'error');
    }
}



// Função auxiliar para converter imagem para Base64
async function convertToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

async function editUnit(unitId, name, cnpj, address, number, complement, neighborhood, city, state, phone, cep) {
    try {
        // Preenche os campos básicos
        document.getElementById('unit-modal-title').textContent = 'Alteração de Dados da Unidade';
        document.getElementById('unit-name').value = name;
        document.getElementById('cnpj').value = cnpj;
        document.getElementById('address').value = address;
        document.getElementById('unit-number').value = number;
        document.getElementById('unit-complement').value = complement;
        document.getElementById('unit-neighborhood').value = neighborhood;
        document.getElementById('unit-city').value = city;
        document.getElementById('unit-state').value = state;
        document.getElementById('unit-phone').value = phone;
        document.getElementById('unit-cep').value = cep;
        document.getElementById('unit-form').dataset.editingId = unitId;

        // Busca dados completos da unidade no Firestore
        const unitDoc = await getDoc(doc(db, 'units', unitId));
        if (unitDoc.exists()) {
            const unitData = unitDoc.data();

            // Preenche o campo site
            document.getElementById('unit-site').value = unitData.site || '';

            // Exibe a logo atual
            const currentImage = document.getElementById('current-image');
            if (unitData.image) {
                currentImage.src = unitData.image;
                currentImage.style.display = 'block';
            } else {
                currentImage.style.display = 'none';
            }

            // Popula as certificações
            const certificationsContainer = document.getElementById('certifications-container');
            certificationsContainer.innerHTML = ''; // Limpa certificações existentes

            if (unitData.certifications && unitData.certifications.length > 0) {
                unitData.certifications.forEach(certification => {
                    const newCertificationInput = document.createElement('div');
                    newCertificationInput.style.display = 'flex';
                    newCertificationInput.style.alignItems = 'center';
                    newCertificationInput.innerHTML = `
                        <input type="text" class="certification" placeholder="Ex: ISO 9001:2015" style="flex: 1;" value="${certification}">
                        <button type="button" class="certification-button remove-certification" style="margin-left: 5px;">-</button>
                    `;
                    certificationsContainer.appendChild(newCertificationInput);

                    // Evento para remover o campo de certificação
                    newCertificationInput.querySelector('.remove-certification').addEventListener('click', () => {
                        certificationsContainer.removeChild(newCertificationInput);
                    });
                });
            }
        }

        document.getElementById('unit-modal').classList.remove('hidden');
    } catch (error) {
        console.error('Erro ao carregar unidade:', error);
        Swal.fire('Erro!', 'Erro ao carregar dados da unidade.', 'error');
    }
}


async function deleteUnit(unitId) {
    const result = await Swal.fire({
        title: 'Confirmar exclusão',
        text: 'Tem certeza que deseja excluir esta unidade?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sim, excluir',
        cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
        try {
            await deleteDoc(doc(db, 'units', unitId));
            Swal.fire('Sucesso!', 'Unidade excluída com sucesso.', 'success');
            loadUnitsList();
        } catch (error) {
            console.error("Erro ao excluir unidade:", error);
            Swal.fire('Erro!', 'Erro ao excluir unidade.', 'error');
        }
    }
}

function clearUnitModal() {
    document.getElementById('unit-name').value = '';
    document.getElementById('cnpj').value = '';
    document.getElementById('address').value = '';
    document.getElementById('unit-number').value = '';
    document.getElementById('unit-complement').value = '';
    document.getElementById('unit-neighborhood').value = '';
    document.getElementById('unit-city').value = '';
    document.getElementById('unit-state').value = '';
    document.getElementById('unit-phone').value = '';
    document.getElementById('unit-cep').value = '';
    document.getElementById('unit-site').value = '';
    document.getElementById('unit-form').dataset.editingId = '';

    // Limpar container de certificações
    const certificationsContainer = document.getElementById('certifications-container');
    certificationsContainer.innerHTML = '';

    // Limpar imagem atual e esconder
    const currentImage = document.getElementById('current-image');
    if (currentImage) {
        currentImage.src = '';
        currentImage.style.display = 'none';
    }
}


function clearSectorModal() {
    document.getElementById('sector-name').value = '';
    document.getElementById('sector-description').value = '';
    document.getElementById('sector-form').dataset.editingId = '';
}

async function editSector(sectorId) {
    try {
        const sectorDoc = await getDoc(doc(db, 'sectors', sectorId));
        if (sectorDoc.exists()) {
            const sectorData = sectorDoc.data();
            document.getElementById('sector-modal-title').textContent = 'Alteração de Setores';
            document.getElementById('sector-name').value = sectorData.name;
            document.getElementById('sector-description').value = sectorData.description || '';
            document.getElementById('sector-form').dataset.editingId = sectorId;
            document.getElementById('sector-modal').classList.remove('hidden');
        }
    } catch (error) {
        console.error("Erro ao carregar setor:", error);
        Swal.fire('Erro!', 'Erro ao carregar dados do setor.', 'error');
    }
}

async function deleteSector(sectorId) {
    const result = await Swal.fire({
        title: 'Confirmar exclusão',
        text: 'Tem certeza que deseja excluir este setor?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sim, excluir',
        cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
        try {
            await deleteDoc(doc(db, 'sectors', sectorId));
            Swal.fire('Sucesso!', 'Setor excluído com sucesso.', 'success');
            loadSectorsList();
        } catch (error) {
            console.error("Erro ao excluir setor:", error);
            Swal.fire('Erro!', 'Erro ao excluir setor.', 'error');
        }
    }
}

async function addSector(sectorName) {
    try {
        await addDoc(collection(db, 'sectors'), {
            name: sectorName,
            createdAt: new Date().toISOString(),
            origem: "Criado pelo Gerenciamento"
        });
        
        await loadSectorsList(); // Recarrega a lista de setores
        Swal.fire('Sucesso!', 'Setor adicionado com sucesso!', 'success');
    } catch (error) {
        console.error("Erro ao adicionar setor:", error);
        Swal.fire('Erro!', 'Erro ao adicionar setor.', 'error');
    }
}

// Expor funções necessárias globalmente
window.editSector = editSector;
window.deleteSector = deleteSector;
window.editUnit = editUnit;
window.deleteUnit = deleteUnit;
window.loadUnitsList = loadUnitsList;
window.loadSectorsList = loadSectorsList;
window.handleUnitSubmit = handleUnitSubmit;
window.handleSectorSubmit = handleSectorSubmit;
window.clearUnitModal = clearUnitModal;
window.clearSectorModal = clearSectorModal;

function initializeManagement() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Evita recarregar se já estiver ativo
            if (button.classList.contains('active')) return;

            const tab = button.dataset.tab;

            // Atualiza botões
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            // Atualiza conteúdo
            tabContents.forEach(content => content.classList.add('hidden'));
            const selectedContent = document.getElementById(`${tab}-content`);
            if (selectedContent) selectedContent.classList.remove('hidden');

            // Carrega dados
            if (tab === 'units') {
                loadUnitsList();
            } else if (tab === 'sectors') {
                loadSectorsList();
            }
        });
    });

    // Carregar listas iniciais
    loadUnitsList();
    loadSectorsList();

    // Event listeners para botões de adicionar
    document.getElementById('new-unit-button').addEventListener('click', () => {
        clearUnitModal();
        document.getElementById('unit-modal-title').textContent = 'Cadastro de Nova Unidade';
        document.getElementById('unit-modal').classList.remove('hidden');
    });

    document.getElementById('new-sector-button').addEventListener('click', () => {
        clearSectorModal();
        document.getElementById('sector-modal-title').textContent = 'Cadastro de Novo Setor';
        document.getElementById('sector-modal').classList.remove('hidden');
    });

    // Event listeners para formulários
    document.getElementById('sector-form').addEventListener('submit', handleSectorSubmit);
    document.getElementById('unit-form').addEventListener('submit', handleUnitSubmit);

    // Botão de logout
    document.getElementById('logout-button').addEventListener('click', async () => {
        try {
            await signOut(auth);
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Erro ao fazer logout:', error);
            Swal.fire('Erro!', 'Erro ao fazer logout.', 'error');
        }
    });

    // Botão de adicionar certificação
    const addCertificationButton = document.getElementById("add-certification");
    if (addCertificationButton) {
        addCertificationButton.addEventListener("click", () => {
            const certificationsContainer = document.getElementById("certifications-container");
            const newCertificationInput = document.createElement("div");
            newCertificationInput.style.display = "flex";
            newCertificationInput.style.alignItems = "center";
            newCertificationInput.innerHTML = `
                <input type="text" class="certification" placeholder="Ex: ISO 9001:2015" style="flex: 1;">
                <button type="button" class="certification-button remove-certification" style="margin-left: 5px;">-</button>
            `;
            certificationsContainer.appendChild(newCertificationInput);
            newCertificationInput.querySelector(".remove-certification").addEventListener("click", () => {
                certificationsContainer.removeChild(newCertificationInput);
            });
        });
    }
}

function formatCnpj(event) {
  let value = event.target.value.replace(/\D/g, ''); // Remove caracteres não numéricos
  if (value.length > 14) {
    value = value.slice(0, 14); // Limita o tamanho do CNPJ
  }
  // Formata o CNPJ
  if (value.length > 12) {
    value = value.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d)/, '$1.$2.$3/$4-$5');
  } else if (value.length > 8) {
    value = value.replace(/(\d{2})(\d{3})(\d{3})(\d)/, '$1.$2.$3/$4');
  } else if (value.length > 5) {
    value = value.replace(/(\d{2})(\d{3})(\d)/, '$1.$2.$3');
  } else if (value.length > 2) {
    value = value.replace(/(\d{2})(\d)/, '$1.$2');
  }

  event.target.value = value; // Atualiza o valor do campo de entrada
}

async function fetchAddress() {
  const cepInput = document.getElementById("unit-cep");
  const cep = cepInput.value.replace(/\D/g, '');
  if (cep.length === 8) {
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();
      if (!data.erro) {
        document.getElementById("address").value = data.logradouro;
        document.getElementById("unit-neighborhood").value = data.bairro;
        document.getElementById("unit-city").value = data.localidade;
        document.getElementById("unit-state").value = data.uf;
      } else {
        Swal.fire("CEP não encontrado", "O CEP informado não existe ou não foi encontrado.", "error");
      }
    } catch (error) {
      console.error("Erro ao buscar endereço:", error);
      Swal.fire("Erro!", "Não foi possível buscar o endereço.", "error");
    }
  }
}

function formatCep(event) {
  let value = event.target.value.replace(/\D/g, '');
  if (value.length > 8) {
    value = value.slice(0, 8);
  }
  if (value.length > 5) {
    value = value.replace(/(\d{5})(\d)/, '$1-$2');
  }
  event.target.value = value;
}

// Inicialização após o carregamento do DOM
document.addEventListener('DOMContentLoaded', () => {
    // Verificar autenticação
    onAuthStateChanged(auth, (user) => {
        if (!user) {
            window.location.href = 'login.html';
            return;
        }
        
        initializeManagement();

        // Adiciona event listeners para CNPJ e CEP
        const cnpjInput = document.getElementById("cnpj");
        if (cnpjInput) {
            cnpjInput.addEventListener("input", formatCnpj);
        }

        const cepInput = document.getElementById("unit-cep");
        if (cepInput) {
            cepInput.addEventListener("input", formatCep);
            cepInput.addEventListener("input", fetchAddress);
        }
        const sectorFilterInput = document.getElementById('sector-filter');
    if (sectorFilterInput) {
        sectorFilterInput.addEventListener('input', () => {
            const filterText = sectorFilterInput.value.toLowerCase();
            const filteredSectors = allSectors.filter(sector =>
                sector.name.toLowerCase().includes(filterText)
            );
            renderSectorsTable(filteredSectors);
        });
    }
const unitFilterInput = document.getElementById('unit-filter');
if (unitFilterInput) {
    unitFilterInput.addEventListener('input', () => {
        const filterText = unitFilterInput.value.toLowerCase();
        const filteredUnits = allUnits.filter(unit => {
            const address = `${unit.address}, ${unit.number}${unit.complement ? `, ${unit.complement}` : ''}, ${unit.neighborhood}, ${unit.city} - ${unit.state}`;
            const certifications = unit.certifications ? unit.certifications.join(", ") : "";
            return (
                (unit.name && unit.name.toLowerCase().includes(filterText)) ||
                (unit.cnpj && unit.cnpj.toLowerCase().includes(filterText)) ||
                (address.toLowerCase().includes(filterText)) ||
                (unit.cep && unit.cep.toLowerCase().includes(filterText)) ||
                (certifications.toLowerCase().includes(filterText)) ||
                (unit.site && unit.site.toLowerCase().includes(filterText))
            );
        });
        renderUnitsTable(filteredUnits);
    });
}
    });
});
