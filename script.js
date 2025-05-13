import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js"; 
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-auth.js";

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

document.addEventListener("DOMContentLoaded", async () => {
  const addUnitButton = document.getElementById("add-unit-button");
  const newUnitButton = document.getElementById("new-unit-button");

  // Lógica para abrir o modal de nova unidade
  if (newUnitButton) {
    newUnitButton.onclick = function () {
      clearModal(); // Limpa o modal antes de abrir
      document.getElementById("unit-modal").classList.remove("hidden");
    };
  }

  // Verifique se o botão de adicionar unidade existe antes de adicionar o evento
if (addUnitButton) {
  addUnitButton.onclick = function () {
    Swal.fire({
      title: 'Login',
      html: `
        <input type="text" id="username" class="swal2-input" placeholder="E-mail">
        <input type="password" id="password" class="swal2-input" placeholder="Senha">
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Entrar',
      allowEnterKey: true,
      preConfirm: () => {
        const username = document.getElementById("username").value;
        const password = document.getElementById("password").value;
        if (!username || !password) {
          Swal.showValidationMessage(`Por favor, preencha todos os campos`);
        }
        return { username: username, password: password };
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        await login(result.value.username, result.value.password);
      }
    });

    // Adiciona evento para capturar Enter no campo senha e disparar login
    Swal.getPopup().querySelector('#password').addEventListener('keydown', async (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        const username = Swal.getPopup().querySelector('#username').value;
        const password = Swal.getPopup().querySelector('#password').value;
        if (username && password) {
          await login(username, password);
          Swal.close();
        } else {
          Swal.showValidationMessage('Por favor, preencha todos os campos');
        }
      }
    });
  }
}
  // Função para realizar o login
const login = async (username, password) => {
  try {
    Swal.fire({
      title: 'Entrando...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
    await signInWithEmailAndPassword(auth, username, password);
    Swal.close();
    Swal.fire("Sucesso!", "Login realizado com sucesso.", "success");
    window.location.href = 'management.html';
  } catch (error) {
    Swal.close();
    Swal.fire("Erro!", "Credenciais inválidas.", "error");
  }
};

  // Adicionando o evento de escuta para os campos de entrada
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");

  // Função para lidar com o evento de pressionar a tecla
  const handleKeydown = async (event) => {
    if (event.key === "Enter") {
      // Impede o comportamento padrão do Enter
      event.preventDefault();
      const username = usernameInput.value;
      const password = passwordInput.value;

      // Verifica se os campos estão preenchidos
      if (username && password) {
        await login(username, password);
      } else {
        Swal.showValidationMessage(`Por favor, preencha todos os campos`);
      }
    }
  };

  // Adiciona o evento de escuta para o campo de username e password
  if (usernameInput) {
    usernameInput.addEventListener("keydown", handleKeydown);
  }
  if (passwordInput) {
    passwordInput.addEventListener("keydown", handleKeydown);
  }

  const unitSelect = document.getElementById("unit");
  if (unitSelect) {
    await loadUnitsToSelect();
  } else {
    await loadUnitsList();
  }

  const unitForm = document.getElementById("unit-form");
  if (unitForm) {
    document.getElementById("site").addEventListener("input", function() {
      if (this.value.startsWith("www.")) {
        this.value = "https://" + this.value;
      }
    });
    document.getElementById("unit-cep").addEventListener("input", formatCep);
    document.getElementById("unit-cep").addEventListener("input", fetchAddress);

    document.getElementById("cnpj").addEventListener("input", formatCnpj);
    // Adiciona evento para o botão de adicionar certificação
    const addCertificationButton = document.getElementById("add-certification");
    if (addCertificationButton) {
      addCertificationButton.addEventListener("click", () => {
        const certificationsContainer = document.getElementById("certifications-container");
        const newCertificationInput = document.createElement("div");
        newCertificationInput.innerHTML = `
          <input type="text" class="certification" placeholder="ISO 00000:0000" style="flex: 1;">
          <button type="button" class="certification-button remove-certification" style="margin-left: 5px;">-</button>
        `;
        certificationsContainer.appendChild(newCertificationInput);
        newCertificationInput.querySelector(".remove-certification").addEventListener("click", () => {
          certificationsContainer.removeChild(newCertificationInput);
        });
      });
    }

    unitForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      // Coleta os dados do formulário
      const unitName = document.getElementById("unit-name").value;
      const cnpj = document.getElementById("cnpj").value;
      const address = document.getElementById("address").value;
      const number = document.getElementById("number").value; 
      const complement = document.getElementById("complement").value || null; 
      const neighborhood = document.getElementById("neighborhood").value; 
      const city = document.getElementById("city").value;
      const state = document.getElementById("state").value;
      const cep = document.getElementById("cep").value; // Capturando o CEP
      const site = document.getElementById("site").value; // Captura o site
      const imageFile = document.getElementById("image").files[0]; // Captura o arquivo da imagem

      // Coleta as certificações
      const certificationInputs = document.querySelectorAll(".certification");
      const certifications = Array.from(certificationInputs).map(input => input.value).filter(value => value); // Filtra valores vazios

      const existingUnitSnapshot = await getDocs(collection(db, "units"));
      const existingUnit = existingUnitSnapshot.docs.find(doc => doc.data().cnpj === cnpj);
      
      if (existingUnit) {
        Swal.fire("Erro!", "Já existe uma unidade cadastrada com este CNPJ.", "error");
        return; 
      }

      // Converte a imagem para Base64
      let imageBase64 = null;
      if (imageFile) {
        imageBase64 = await convertToBase64(imageFile); // Converte a imagem para Base64
      }

      const unitData = {
        name: unitName,
        cnpj: cnpj,
        address: address,
        number: number,
        complement: complement,
        neighborhood: neighborhood,
        city: city,
        state: state,
        cep: cep,
        site: site, // Adicionando o site ao objeto
        certifications: certifications, // Adicionando certificações ao objeto
        image: imageBase64 // Adicionando a imagem em Base64 ao objeto
      };

      try {
        await addDoc(collection(db, "units"), unitData);
        Swal.fire("Sucesso!", "Unidade cadastrada com sucesso.", "success");
        unitForm.reset(); 
        loadUnitsList();
      } catch (error) {
        console.error("Erro ao salvar unidade :", error);
        Swal.fire("Erro!", "Não foi possível salvar a unidade.", "error");
      }
    });
  }
});

// Inicialização do Select2 para o campo de setor
$(document).ready(function() {
    $('#sector').select2({
        placeholder: 'Digite para buscar ou cadastrar um setor',
        allowClear: true,
        minimumInputLength: 1,
        language: {
            errorLoading: function() {
                return 'Os resultados não puderam ser carregados.';
            },
            inputTooShort: function() {
                return 'Digite 1 ou mais caracteres';
            },
            noResults: function() {
                return 'Nenhum resultado encontrado';
            },
            searching: function() {
                return 'Buscando…';
            }
        },
        tags: true,
        ajax: {
            transport: async function(params, success, failure) {
                try {
                    const querySnapshot = await getDocs(collection(db, 'sectors'));
                    const setores = [];

                    querySnapshot.forEach((doc) => {
                        const setor = doc.data();
                        let formattedSectorName = setor.name;

                        // Se contém asterisco, usa ele como ponto de quebra
                        if (setor.name.includes('*')) {
                            formattedSectorName = setor.name.replace('*', '\n').trim();
                        }

                        if (params.data.term) {
                            if (setor.name.toLowerCase().includes(params.data.term.toLowerCase())) {
                                setores.push({
                                    id: doc.id,
                                    text: formattedSectorName
                                });
                            }
                        } else {
                            setores.push({
                                id: doc.id,
                                text: formattedSectorName
                            });
                        }
                    });
                    success({ results: setores });
                } catch (error) {
                    console.error("Erro ao buscar setores:", error);
                    failure('Erro ao buscar setores');
                }
            }
        },
        createTag: function(params) {
            let formattedText = params.term;

            // Se contém asterisco, usa ele como ponto de quebra
            if (params.term.includes('*')) {
                formattedText = params.term.replace('*', '\n').trim();
            }

            return {
                id: params.term,
                text: formattedText,
                isNew: true
            };
        }
    }).on('select2:select', async function(e) {
        const data = e.params.data;
        if (data.isNew) {
            // Novo setor selecionado, pedir senha
            const { value: password } = await Swal.fire({
                title: 'Setor não cadastrado',
                text: 'Digite a senha para cadastrar novo setor:',
                input: 'password',
                inputPlaceholder: 'Digite a senha',
                showCancelButton: true,
                confirmButtonText: 'Cadastrar',
                cancelButtonText: 'Cancelar',
                allowEnterKey: true,
                inputValidator: (value) => {
                    if (!value) {
                        return 'Você precisa digitar a senha!';
                    }
                }
            });

            if (password === 'COPEmatt001') { // Substitua pela senha correta
                try {
                    // Adicionar novo setor ao Firestore
                    await addDoc(collection(db, 'sectors'), {
                        name: data.text,
                        description: '',
                        createdAt: new Date().toISOString(),
                        origem: "Criado pelo Filtro"
                    });

                    Swal.fire(
                        'Sucesso!',
                        'Novo setor cadastrado com sucesso!',
                        'success'
                    );
                } catch (error) {
                    console.error("Erro ao cadastrar setor:", error);
                    Swal.fire(
                        'Erro!',
                        'Erro ao cadastrar novo setor.',
                        'error'
                    );
                    // Limpar a seleção em caso de erro
                    $('#sector').val(null).trigger('change');
                }
            } else {
                Swal.fire(
                    'Erro!',
                    'Senha incorreta. Setor não cadastrado.',
                    'error'
                );
                // Limpar a seleção em caso de senha incorreta
                $('#sector').val(null).trigger('change');
            }
        }
    });
});

// Event listener para o formulário de adicionar setor
// document.getElementById('add-sector-form').addEventListener('submit', async (e) => {
//     e.preventDefault();
    
//     const sectorName = document.getElementById('new-sector-name').value;
    
//     try {
//         // Adicionar setor ao Firestore
//         await addDoc(collection(db, 'sectors'), {
//             name: sectorName,
//             createdAt: new Date().toISOString()
//         });
        
//         // Limpar o formulário
//         document.getElementById('new-sector-name').value = '';
        
//         // Atualizar a lista de setores
//         await loadSectors();
        
//         Swal.fire('Sucesso!', 'Setor adicionado com sucesso!', 'success');
//     } catch (error) {
//         console.error("Erro ao adicionar setor:", error);
//         Swal.fire('Erro!', 'Erro ao adicionar setor.', 'error');
//     }
// });

// Função para formatar o CNPJ
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

function convertToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      resolve(reader.result);
    };
    reader.onerror = (error) => {
      reject(error);
    };
  });
}

// Função para buscar endereço pelo CEP
window.fetchAddress = async function() {
  const cep = document.getElementById("cep").value.replace(/\D/g, ''); // Remove caracteres não numéricos
  if (cep.length === 8) {
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();
      if (!data.erro) {
        document.getElementById("address").value = data.logradouro;
        document.getElementById("neighborhood").value = data.bairro; // Preenchendo o bairro
        document.getElementById("city").value = data.localidade;
        document.getElementById("state").value = data.uf;
      } else {
        Swal.fire("CEP não encontrado", "O CEP informado não existe ou não foi encontrado.", "error");
      }
    } catch (error) {
      console.error("Erro ao buscar endereço:", error);
      Swal.fire("Erro!", "Não foi possível buscar o endereço.", "error");
    }
  }
};

// Função para carregar unidades na lista
async function loadUnitsList() {
  const unitsList = document.getElementById("units-list");
  if (!unitsList) return;

  const tbody = unitsList.querySelector("tbody");
  tbody.innerHTML = ""; // Limpa a lista atual

  try {
    const querySnapshot = await getDocs(collection(db, "units"));
    querySnapshot.forEach((doc) => {
      const unit = doc.data();
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
      editButton.onclick = () => editUnit(doc.id, unit.name, unit.cnpj, unit.address, unit.number, unit.complement, unit.neighborhood, unit.city, unit.state, unit.phone, unit.cep);

      // Botão de excluir
      const deleteButton = document.createElement("button");
      deleteButton.className = "btn-delete";
      deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
      deleteButton.onclick = () => deleteUnit(doc.id);

      actionsDiv.appendChild(editButton);
      actionsDiv.appendChild(deleteButton);
      actionsCell.appendChild(actionsDiv);
      tr.appendChild(actionsCell);

      tbody.appendChild(tr);
    });
  } catch (error) {
    console.error("Erro ao carregar unidades:", error);
  }
}

// Função auxiliar para criar células da tabela
function createCell(content) {
  const td = document.createElement("td");
  td.textContent = content || "";
  return td;
}

async function loadUnitsToSelect() {
  const unitSelect = document.getElementById("unit");
  unitSelect.innerHTML = ""; 

  // Adiciona a opção padrão
  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "Selecione a unidade";
  defaultOption.selected = true;
  defaultOption.disabled = true;
  unitSelect.appendChild(defaultOption);

  try {
    const snapshot = await getDocs(collection(db, "units"));
    snapshot.forEach((doc) => {
      const unit = doc.data();
      const option = document.createElement("option");
      option.value = doc.id; 
      option.textContent = unit.name; 
      unitSelect.appendChild(option);
    });
  } catch (error) {
    console.error("Erro ao carregar unidades:", error);
  }
}

let editingUnitId = null; // Variável global para armazenar o ID da unidade que está sendo editada

// Ao editar uma unidade, preenche as certificações ou permite adicionar novas
window.editUnit = async function(unitId, name, cnpj, address, number, complement, neighborhood, city, state, cep) {
  editingUnitId = unitId; // Armazena o ID da unidade que está sendo editada

  // Abre o modal
  document.getElementById("unit-modal").classList.remove("hidden");

  // Preenche os campos do formulário com os dados da unidade
  document.getElementById("unit-name").value = name;
  document.getElementById("cnpj").value = cnpj;
  document.getElementById("address").value = address;
  document.getElementById("number").value = number; 
  document.getElementById("complement").value = complement; 
  document.getElementById("neighborhood").value = neighborhood;
  document.getElementById("city").value = city;
  document.getElementById("state").value = state;
  document.getElementById("cep").value = cep; // Atualizando o CEP

  // Carrega a unidade do Firestore para obter as certificações e o site
  const unitDoc = await getDoc(doc(db, "units", unitId));
  const unitData = unitDoc.data();

  // Preenche o campo do site
  document.getElementById("site").value = unitData.site;

  // Preenche as certificações
  const certificationsContainer = document.getElementById("certifications-container");
  certificationsContainer.innerHTML = ""; // Limpa as certificações existentes
  
  unitData.certifications.forEach(certification => {
    const newCertificationInput = document.createElement("div");
    newCertificationInput.style.display = "flex";
    newCertificationInput.style.alignItems = "center";
    newCertificationInput.innerHTML = `
      <input type="text" class="certification" placeholder="Ex: ISO 9001:2015" style="flex: 1;" value="${certification}">
      <button type="button" class="certification-button remove-certification" style="margin-left: 5px;">-</button>
    `;
    certificationsContainer.appendChild(newCertificationInput);
    
    // Adiciona evento para remover o campo de certificação
    newCertificationInput.querySelector(".remove-certification").addEventListener("click", () => {
      certificationsContainer.removeChild(newCertificationInput);
    });
  });

  // Carrega a imagem atual
  const currentImage = document.getElementById("current-image");
  currentImage.src = unitData.image; // Define a imagem atual
  currentImage.style.display = "block"; // Exibe a imagem

  // Adiciona o evento de submissão do formulário
  const unitForm = document.getElementById("unit-form");
  unitForm.onsubmit = async (event) => {
    event.preventDefault();
    const updatedUnitData = {
      name: document.getElementById("unit-name").value,
      cnpj: document.getElementById("cnpj").value,
      address: document.getElementById("address").value,
      number: document.getElementById("number").value,
      complement: document.getElementById("complement").value || null,
      neighborhood: document.getElementById("neighborhood").value,
      city: document.getElementById("city").value,
      state: document.getElementById("state").value,
      cep: document.getElementById("cep").value, // Atualizando o CEP
      site: document.getElementById("site").value, // Adicionando o site ao objeto
      certifications: Array.from(document.querySelectorAll(".certification")).map(input => input.value).filter(value) // Coletando certificações
    };

    // Verifica se o usuário selecionou uma nova imagem
    const imageFile = document.getElementById("image").files[0]; // Captura o arquivo da nova imagem
    if (imageFile) {
      updatedUnitData.image = await convertToBase64(imageFile); // Converte a nova imagem para Base64
    } else {
      updatedUnitData.image = unitData.image; // Mantém a imagem existente se nenhuma nova imagem for selecionada
    }

    try {

      // Verifica se o CNPJ já existe, mas ignora a unidade que está sendo editada
      const existingUnitSnapshot = await getDocs(collection(db, "units"));
      const existingUnit = existingUnitSnapshot.docs.find(doc => doc.data().cnpj === updatedUnitData.cnpj && doc.id !== editingUnitId);
    
      if (existingUnit) {
        Swal.fire("Erro!", "Já existe uma unidade cadastrada com este CNPJ.", "error");
        return;
      }

        // Atualiza a unidade
        await updateDoc(doc(db, "units", editingUnitId), updatedUnitData);
        Swal.fire("Sucesso!", "Unidade atualizada com sucesso.", "success");
        unitForm.reset(); 
        loadUnitsList(); 
        document.getElementById("unit-modal").classList.add("hidden"); // Fecha o modal após a atualização
    } catch (error) {
        console.error("Erro ao atualizar unidade:", error);
        Swal.fire("Erro!", "Não foi possível atualizar a unidade.", "error");
    }
};
}

function clearModal() {
  document.getElementById("unit-name").value = '';
  document.getElementById("cnpj").value = '';
  document.getElementById("address").value = '';
  document.getElementById("number").value = '';
  document.getElementById("complement").value = '';
  document.getElementById("neighborhood").value = '';
  document.getElementById("city").value = '';
  document.getElementById("state").value = '';
  document.getElementById("cep").value = '';
  document.getElementById("site").value = '';
  document.getElementById("image").value = ''; // Limpa o campo de arquivo
  document.getElementById("current-image").style.display = "none"; // Esconde a imagem
  const certificationsContainer = document.getElementById("certifications-container");
  certificationsContainer.innerHTML = ""; // Limpa as certificações
}

window.deleteUnit = async function(unitId) {
  // Buscando os dados da unidade a ser excluída
  const unitDoc = await getDoc(doc(db, "units", unitId));
  const unitData = unitDoc.data();

  // Criando uma string para mostrar os detalhes da unidade
  const unitDetails = `
    <div style="text-align: left;">
      <strong>Unidade:</strong> ${unitData.name}<br>
      <strong>CNPJ:</strong> ${unitData.cnpj}<br>
      <strong>Endereço:</strong> ${unitData.address}, ${unitData.number} ${unitData.complement ? ', ' + unitData.complement : ''}<br>
      <strong>Bairro:</strong> ${unitData.neighborhood}<br>
      <strong>Cidade:</strong> ${unitData.city}<br>
      <strong>Estado:</strong> ${unitData.state}<br>
      <strong>CEP:</strong> ${unitData.cep}<br>
      <strong>Certificações:</strong> ${unitData.certifications ? unitData.certifications.join(', ') : 'N/A'}
    </div>
  `;

  // Exibindo a confirmação com os detalhes da unidade
  const confirmDelete = await Swal.fire({
    title: 'Tem certeza que deseja excluir esta unidade?',
    html: unitDetails, // Exibindo os detalhes da unidade
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Sim, excluir!'
  });

  if (confirmDelete.isConfirmed) {
    try {
      await deleteDoc(doc(db, "units", unitId)); // Deleta o documento da coleção "units"
      Swal.fire("Deletado!", "A unidade foi excluída.", "success");
      loadUnitsList(); // Atualiza a lista de unidades
    } catch (error) {
      console.error("Erro ao deletar unidade:", error);
      Swal.fire("Erro!", "Não foi possível excluir a unidade.", "error");
    }
  }
}

// Defina a função no escopo global
window.formatCep = function(event) {
  let value = event.target.value.replace(/\D/g, '');
  if (value.length > 8) {
    value = value.slice(0, 8);
  }

  // Formatar o CEP do endereço das Unidades inter
  if (value.length > 5) {
    value = value.replace(/(\d{5})(\d)/, '$1-$2');
  }

  event.target.value = value; // Atualiza o valor do campo de entrada
}


const emailInput = document.getElementById('email');
const emailSuggestions = document.getElementById('email-suggestions');

const isValidEmail = (email) => {
    // Regex para validar formato de e-mail
    const emailRegex = /^[a-zA-Z0-9._%+-]+@(intermaritima\.com\.br|intersal\.com\.br)$/;
    return emailRegex.test(email);
  };
  

// Para demonstrar a sugestão de e-mail somente inter e intersal
emailInput.addEventListener("input", () => {
    const value = emailInput.value.trim();
  
    if (isValidEmail(value)) {
      emailInput.style.borderColor = "green"; // Borda verde para válido
    } else {
      emailInput.style.borderColor = "red"; // Borda vermelha para inválido
    }
  
    // Sugestões de e-mail
    if (value.includes('@')) {
      emailSuggestions.innerHTML = `
        <option value="${value.split('@')[0]}@intermaritima.com.br">
        <option value="${value.split('@')[0]}@intersal.com.br">
      `;
    } else {
      emailSuggestions.innerHTML = '';
    }
  });
  
  document.addEventListener("DOMContentLoaded", () => {
    const phonesContainer = document.getElementById("phones-container");
    const addPhoneButton = document.getElementById("add-phone");

    // Função para adicionar um novo campo de telefone
    const addPhoneField = () => {
        const phoneDiv = document.createElement("div");
        phoneDiv.classList.add("phone-input");

        phoneDiv.innerHTML = `
          <input type="text" name="phone" class="phone-field" placeholder="(00) 90000-0000">
          <select class="phone-type">
            <option value="fixo">Fixo</option>
            <option value="celular" selected>Celular</option>
          </select>
          <button type="button" class="remove-phone">
            <i class="fas fa-minus"></i>
          </button>
        `;

        const phoneInput = phoneDiv.querySelector(".phone-field");
        const phoneType = phoneDiv.querySelector(".phone-type");

        // Altera o placeholder baseado no tipo de telefone
        const updatePlaceholder = () => {
            if (phoneType.value === "celular") {
                phoneInput.setAttribute("placeholder", "(71) 9 9999-9999"); // Placeholder para celular
            } else {
                phoneInput.setAttribute("placeholder", "(71) 9999-9999"); // Placeholder para fixo
            }
        };

        // Chama a função para definir o placeholder ao carregar
        updatePlaceholder();

        // Adiciona evento de entrada para formatar o telefone
        phoneInput.addEventListener("input", () => {
          phoneInput.value = formatPhone(phoneInput.value, phoneType.value);
        });

        // Atualiza a formatação e o placeholder ao trocar o tipo
        phoneType.addEventListener("change", () => {
          phoneInput.value = formatPhone(phoneInput.value, phoneType.value);
          updatePlaceholder(); // Atualiza o placeholder quando o tipo mudar
        });

        const removeButton = phoneDiv.querySelector(".remove-phone");
        removeButton.addEventListener("click", () => {
          phonesContainer.removeChild(phoneDiv);

          // Esconde o botão de remover se houver apenas um campo
          if (phonesContainer.children.length === 1) {
            const remainingRemoveButton = phonesContainer.querySelector(".remove-phone");
            if (remainingRemoveButton) {
              remainingRemoveButton.classList.add("hidden");
            }
          }
        });

        phonesContainer.appendChild(phoneDiv);

        // Mostra o botão de remover em todos os campos
        document.querySelectorAll(".remove-phone").forEach(btn => {
          if (btn) {
            btn.classList.remove("hidden");
          }
        });
    };

    // Adiciona o evento ao botão "Adicionar Telefone"
    if (addPhoneButton) {
      addPhoneButton.addEventListener("click", addPhoneField);
    }

    // Configuração do botão "Remover" no campo inicial
    const initialRemoveButton = phonesContainer.querySelector(".remove-phone");
    if (initialRemoveButton) {
      initialRemoveButton.classList.add("hidden");
    }

    // Adiciona suporte à formatação dinâmica no campo inicial
    const initialPhoneField = phonesContainer.querySelector(".phone-field");
    const initialPhoneType = phonesContainer.querySelector(".phone-type");

    if (initialPhoneField && initialPhoneType) {
      // Evento para formatar o número enquanto o usuário digita
      initialPhoneField.addEventListener("input", () => {
        initialPhoneField.value = formatPhone(initialPhoneField.value, initialPhoneType.value);
      });

      // Evento para reformatar ao trocar o tipo entre fixo e celular
      initialPhoneType.addEventListener("change", () => {
        initialPhoneField.value = formatPhone(initialPhoneField.value, initialPhoneType.value);
        updatePlaceholder(); // Atualiza o placeholder quando o tipo mudar
      });

      // Adiciona o placeholder para o campo inicial de acordo com o tipo
      const updatePlaceholder = () => {
        if (initialPhoneType.value === "celular") {
          initialPhoneField.setAttribute("placeholder", "(71) 9 9999-9999");
        } else {
          initialPhoneField.setAttribute("placeholder", "(71) 9999-9999");
        }
      };
      
      updatePlaceholder(); // Define o placeholder inicial baseado no tipo
    }
});

// Função para capturar e formatar os telefones
const getFormattedPhones = () => {
  const phoneInputs = Array.from(document.querySelectorAll(".phone-input"));
  const phones = { fixo: [], celular: [] };

  phoneInputs.forEach(input => {
    const phone = input.querySelector(".phone-field").value.trim();
    const type = input.querySelector(".phone-type").value;

    if (phone) phones[type].push(phone);
  });

  let phoneText = "";
  if (phones.fixo.length > 0) {
    phoneText += `Fixo: ${phones.fixo.join(" / ")}`;
  }
  if (phones.celular.length > 0) {
    if (phoneText) phoneText += " ";
    phoneText += `Celular: +55 ${phones.celular.join(" / ")}`;
  }

  return phoneText;
};

const formatPhone = (value, type) => {
  // Remove todos os caracteres que não sejam números
  value = value.replace(/\D/g, '');

  if (type === 'fixo') {
    // Limita a 10 dígitos para números fixos
    value = value.slice(0, 10);

    // Formata como (XX) XXXX-XXXX
    if (value.length > 6) {
      value = value.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    } else if (value.length > 2) {
      value = value.replace(/(\d{2})(\d{0,4})/, '($1) $2');
    }
  } else if (type === 'celular') {
    // Limita a 11 dígitos para celulares
    value = value.slice(0, 11);

    // Formata como (XX) X XXXX-XXXX
    if (value.length > 7) {
      value = value.replace(/(\d{2})(\d{1})(\d{4})(\d{0,4})/, '($1) $2 $3-$4');
    } else if (value.length > 2) {
      value = value.replace(/(\d{2})(\d{1})(\d{0,4})/, '($1) $2 $3');
    }
  }

  return value;
};

// Função para gerar assinatura
function generateSignature(data) {
    const signatureHtml = `
        <table style="font-family: Arial, sans-serif; font-size: 10pt; line-height: 1.4; color: #333333; border-collapse: collapse;">
            <tr>
                <td style="padding: 0;">
                    <div style="margin-bottom: 10px;">
                        <strong style="color: #333333; font-size: 11pt;">${data.name}</strong><br>
                        <span style="color: #666666; white-space: pre-line; display: block; margin-bottom: 5px;">${data.sector}</span>
                        <a href="mailto:${data.email}" style="color: #666666; text-decoration: none; display: block;">${data.email}</a>
                        ${data.skype ? `<br><span style="color: #666666;">Skype: ${data.skype}</span>` : ''}
                        ${data.phones.map(phone => `<br><span style="color: #666666;">${phone.type === 'celular' ? 'Celular' : 'Fixo'}: ${phone.number}</span>`).join('')}
                    </div>
                    <div style="margin-bottom: 10px;">
                        <a href="${data.unit.site}" target="_blank">
                            <img src="${data.unit.image}" alt="${data.unit.name}" style="max-width: 180px; height: auto; border: 0;">
                        </a>
                    </div>
                    <div style="margin-bottom: 5px;">
                        <a href="${data.unit.site}" style="color: #666666; text-decoration: none;" target="_blank">${data.unit.site}</a>
                    </div>
                    <div style="color: #666666; font-size: 9pt;">
                        ${data.unit.address}, ${data.unit.number}${data.unit.complement ? `, ${data.unit.complement}` : ''}${data.unit.neighborhood ? ', ' + data.unit.neighborhood : ''}<br>
                        ${data.unit.city} - ${data.unit.state} CEP: ${data.unit.cep}
                    </div>
                    <div style="margin-top: 10px; font-size: 8pt; color: #008000; font-style: italic;">
                        Antes de imprimir, pense em seu compromisso com o Meio Ambiente e o comprometimento com os Custos.
                    </div>
                </td>
            </tr>
        </table>
    `;

    const previewDiv = document.getElementById('signature-preview');
    previewDiv.innerHTML = signatureHtml;

    // Salvar a assinatura gerada para uso posterior
    window.generatedSignature = signatureHtml;
}

// Mostra a assinatura no canvas
document.getElementById("signature-canvas").style.display = "block";
document.getElementById("signature-preview").style.display = "none";

document.getElementById("send-email-button").addEventListener("click", async () => {
  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;

  if (!name || !email) {
      Swal.fire("Erro", "Certifique-se de preencher o nome e o e-mail.", "error");
      return;
  }

  // Obter a imagem da prévia
  const previewImg = document.querySelector("#signature-preview img");
  if (!previewImg) {
      Swal.fire("Erro", "Por favor, gere a assinatura primeiro.", "error");
      return;
  }

  // Corpo do e-mail com instruções mais detalhadas
  const emailBody = `
Caro colaborador ${name},

Segue em anexo sua assinatura de e-mail. Por favor, siga as instruções abaixo para adicioná-la:

Passos para adicionar/alterar a assinatura via webmail:

1. Salve a imagem da assinatura que está em anexo
2. No Outlook Web, clique em Configurações (ícone de engrenagem)
3. Procure por "Exibir todas as configurações do Outlook"
4. Vá em Email > Compose and Reply
5. Em "Email signature", clique em "New signature"
6. Clique no ícone de imagem
7. Selecione a imagem da assinatura que você salvou
8. Ajuste o tamanho se necessário
9. Clique em "Save"

Em caso de dúvidas, entre em contato com:

Dionatam Carniel
Celular: (71) 99601-8476
E-mail: dionatam.carniel@intermaritima.com.br

Alexandre Gadelha
Celular: (71) 99701-2076
E-mail: alexandre.gadelha@intermaritima.com.br

Tutorial completo: https://support.microsoft.com/pt-br/office/criar-uma-assinatura-de-e-mail-a-partir-de-um-modelo-5b02c5ed-1e85-4d2a-a098-9628fe3231d8
`;

  try {
      // Criar o link mailto
      const mailtoLink = `mailto:${email}?subject=Sua Nova Assinatura de E-mail&body=${encodeURIComponent(emailBody)}`;
      
      // Abrir o cliente de e-mail
      window.location.href = mailtoLink;

      // Mostrar instruções adicionais
      Swal.fire({
          title: "Próximos Passos",
          html: `
              <div style="text-align: left;">
                  <p><strong>1.</strong> Primeiro, clique no botão "Download" para salvar sua assinatura</p>
                  <p><strong>2.</strong> No seu e-mail que foi aberto:</p>
                  <ul>
                      <li>Anexe o arquivo da assinatura que você baixou</li>
                      <li>Revise o conteúdo do e-mail</li>
                      <li>Envie o e-mail</li>
                  </ul>
              </div>
          `,
          icon: "info",
          confirmButtonText: "Entendi"
      });
  } catch (error) {
      console.error("Erro ao enviar e-mail:", error);
      Swal.fire("Erro", "Houve um erro ao tentar abrir seu cliente de e-mail.", "error");
  }
});

// Função para baixar a imagem
async function downloadImage(dataURL, name, unitId) {
  const link = document.createElement("a");

  // Buscar os dados da unidade a partir do unitId
  const unitData = await getUnitData(unitId);  // Supondo que a função getUnitData recupere os dados da unidade
  const unitName = unitData.name;
  // Nome do arquivo com o formato: "Nome da Pessoa - Nome da Unidade"
  const formattedName = `Assinatura de ${name} - ${unitName}.png`;
  
  link.href = dataURL;
  link.download = formattedName;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Função para buscar dados da unidade
async function getUnitData(unitId) {
  try {
      const docRef = doc(db, "units", unitId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
          return docSnap.data(); // Retorna os dados da unidade
      } else {
          console.error("No such document!");
          return {}; // Retorna um objeto vazio se não encontrar
      }
  } catch (error) {
      console.error("Error getting document:", error);
      return {}; // Retorna um objeto vazio em caso de erro
  }
}

// Event listener para o formulário de assinatura
document.getElementById("signature-form").addEventListener("submit", async (event) => {
    event.preventDefault();
  
    const emailInput = document.getElementById("email");
    const email = emailInput.value.trim();
  
    // Valida o e-mail antes de continuar
    if (!isValidEmail(email)) {
      Swal.fire("Erro", "Por favor, insira um e-mail válido:<p>'intermaritima.com.br' ou 'intersal.com.br'.", "error");
      return;
    }
  
    // Captura os outros dados do formulário
    const unit = document.getElementById("unit").value;
    const name = document.getElementById("name").value;
    
    // Obter o nome do setor do Select2
    const sectorSelect = $('#sector');
    const sector = sectorSelect.select2('data')[0].text;
    console.log('Setor selecionado:', sector); // Debug log
    
    const phoneText = getFormattedPhones(); // Telefones formatados
    const skype = document.getElementById("skype").value.trim(); // Captura o valor do Skype

    // Captura os dados da unidade
    const unitData = await getUnitData(unit);
    if (!unitData) {
        Swal.fire("Erro", "Dados da unidade não encontrados.", "error");
        return;
    }

    const { image, site: rawSite, certifications, address, number, city, cep, state, complement, neighborhood } = unitData;

    const site = rawSite ? rawSite.replace(/^https?:\/\//, '') : '';
    const logo = image || 'path/to/default/logo.png';

    const canvas = document.getElementById("signature-canvas");
    const ctx = canvas.getContext("2d");

    // Ajuste para qualidade da imagem
    const scaleFactor = 2; // Fator de escala para aumentar a resolução
    canvas.width = 710 * scaleFactor;
    canvas.height = 240 * scaleFactor;

    // Redefine o tamanho visível no navegador
    canvas.style.width = "710px";
    canvas.style.height = "240px";

    // Aplica a escala no contexto do canvas
    ctx.scale(scaleFactor, scaleFactor);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const logoImage = new Image();
    logoImage.src = logo;

    logoImage.onload = () => {
        ctx.drawImage(logoImage, 24, 40, 180, 65);

        //Linha separadora
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(250, 20);
        ctx.lineTo(250, 190);
        ctx.strokeStyle = "gray";
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.setLineDash([]);

        // Centralizar site no primeiro quadrante
        ctx.font = "bold 14px Arial";
        ctx.fillStyle = 'gray';
        const siteWidth = ctx.measureText(site).width;
        ctx.fillText(site, 40 + (150 - siteWidth) / 2, 140);

        // Certificações
        if (certifications && certifications.length > 0) {
            ctx.font = "12px Arial";
            const certY = 160;
            const maxCertsPerLine = 2; // Máximo de certificações por linha
            const lineHeight = 15; // Altura da linha
            
            // Itera sobre as certificações em grupos de maxCertsPerLine
            for (let i = 0; i < certifications.length; i += maxCertsPerLine) {
                // Pega até maxCertsPerLine certificações
                const lineCertifications = certifications.slice(i, i + maxCertsPerLine);
                const certText = lineCertifications.join(" / ");
                const certWidth = ctx.measureText(certText).width;
                
                // Desenha a linha no canvas
                ctx.fillText(certText, 40 + (150 - certWidth) / 2, certY + Math.floor(i / maxCertsPerLine) * lineHeight);
            }
        }

        // Dados do colaborador
        ctx.font = "bold 14px Arial";
        const cleanSector = sector.replace('*', '\n');
        const sectorLines = cleanSector.split('\n');
        
        // Formata o endereço uma vez só
        const formattedAddress = `${address}, ${number}${complement ? ' ' + complement : ''}${neighborhood ? ', ' + neighborhood : ''}`;
        
        // Ajusta a posição do nome quando o setor tem duas linhas
        const nameY = sectorLines.length > 1 ? 30 : 40;
        ctx.fillText(name, 270, nameY);
        
        // Quebra o setor em duas linhas se houver asterisco
        ctx.font = "14px Arial";
        if (sectorLines.length > 1) {
            // Posições para duas linhas
            ctx.fillText(sectorLines[0].trim(), 270, 50);
            ctx.fillText(sectorLines[1].trim(), 270, 70);
            ctx.fillText(email, 270, 90);
            
            // Linha tracejada
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(270, 105);
            ctx.lineTo(720, 105);
            ctx.stroke();
            ctx.setLineDash([]);
            
            // Endereço logo após a linha
            ctx.font = "12px Arial";
            const addressLines = [formattedAddress, `${city} - ${state} CEP: ${cep}`];
            let addrY = 125;
            
            addressLines.forEach(line => {
                ctx.fillText(line, 270, addrY);
                addrY += 20;
            });
            
            // Posições dos elementos inferiores para duas linhas
            if (phoneText) {
                ctx.font = "bold 12px Arial";
                ctx.fillText(phoneText, 270, 165);
            }
            
            if (skype) {
                const skypeIcon = new Image();
                skypeIcon.src = "skype.png";
                
                skypeIcon.onerror = () => {
                    console.error("Failed to load Skype icon");
                };
                
                skypeIcon.onload = () => {
                    ctx.drawImage(skypeIcon, 270, 150, 74, 74);
                    ctx.font = "14px Arial";
                    ctx.fillText(skype, 350, 188);
                    finalizarAssinatura();
                };
            } else {
                finalizarAssinatura();
            }
        } else {
            // Posições para uma linha
            ctx.fillText(sector, 270, 60);
            ctx.fillText(email, 270, 80);
            
            // Linha tracejada
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(270, 95);
            ctx.lineTo(720, 95);
            ctx.stroke();
            ctx.setLineDash([]);
            
            // Endereço logo após a linha
            ctx.font = "12px Arial";
            const addressLines = [formattedAddress, `${city} - ${state} CEP: ${cep}`];
            let addrY = 115;
            
            addressLines.forEach(line => {
                ctx.fillText(line, 270, addrY);
                addrY += 20;
            });
            
            // Posições dos elementos inferiores para uma linha
            if (phoneText) {
                ctx.font = "bold 12px Arial";
                ctx.fillText(phoneText, 270, 165);
            }
            
            if (skype) {
                const skypeIcon = new Image();
                skypeIcon.src = "skype.png";
                
                skypeIcon.onerror = () => {
                    console.error("Failed to load Skype icon");
                };
                
                skypeIcon.onload = () => {
                    ctx.drawImage(skypeIcon, 270, 150, 74, 74);
                    ctx.font = "14px Arial";
                    ctx.fillText(skype, 350, 188);
                    finalizarAssinatura();
                };
            } else {
                finalizarAssinatura();
            }
        }

        function finalizarAssinatura() {
            // Texto de sustentabilidade
            ctx.fillStyle = "#28a745";
            ctx.font = "12px Arial";
            
            const sustainabilityText = "Antes de imprimir, pense em seu compromisso com o Meio Ambiente e o comprometimento com os Custos.";
            const textWidth = ctx.measureText(sustainabilityText).width;
            const startX = (canvas.width / scaleFactor - textWidth) / 2;
            let currentX = startX;
            
            // Primeira parte do texto
            const part1 = "Antes de imprimir, pense em seu compromisso com o ";
            ctx.fillText(part1, currentX, 235);
            currentX += ctx.measureText(part1).width;
            
            // "Meio Ambiente" em negrito
            ctx.font = "bold 12px Arial";
            const part2 = "Meio Ambiente";
            ctx.fillText(part2, currentX, 235);
            currentX += ctx.measureText(part2).width;
            
            // Continuação do texto normal
            ctx.font = "12px Arial";
            const part3 = " e o comprometimento com os ";
            ctx.fillText(part3, currentX, 235);
            currentX += ctx.measureText(part3).width;
            
            // "Custos" em negrito
            ctx.font = "bold 12px Arial";
            ctx.fillText("Custos.", currentX, 235);

            // Gera a imagem final após todo o texto ser renderizado
            setTimeout(() => {
                const dataURL = canvas.toDataURL("image/png");
                
                // Atualiza a prévia
                document.getElementById("signature-preview").innerHTML = `<img src="${dataURL}" alt="Pré-visualização da Assinatura">`;
                
                // Esconde o canvas e mostra a prévia
                document.getElementById("signature-canvas").style.display = "none";
                document.getElementById("signature-preview").style.display = "block";
                
                // Mostra os botões de ação
                document.getElementById("download-button").style.display = "flex";
                document.getElementById("send-email-button").style.display = "flex";

                // Configura o botão de download
                const downloadButton = document.getElementById("download-button");
                downloadButton.onclick = () => {
                    downloadImage(dataURL, name, unit);
                };
            }, 100);
        }
    };
});