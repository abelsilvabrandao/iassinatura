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
    }
  }

  // Função para realizar o login
  const login = async (username, password) => {
    try {
      await signInWithEmailAndPassword(auth, username, password);
      Swal.fire("Sucesso!", "Login realizado com sucesso.", "success");
      window.location.href = 'add-unit.html';
    } catch (error) {
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
    document.getElementById("cep").addEventListener("input", formatCep);
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
window.editUnit = async function(unitId, name, cnpj, address, number, complement, neighborhood, city, state, phone, cep) {
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
  document.getElementById("current-image").style.display = "none"; // Esconde a imagem atual
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
            remainingRemoveButton.classList.add("hidden");
          }
        });

        phonesContainer.appendChild(phoneDiv);

        // Mostra o botão de remover em todos os campos
        document.querySelectorAll(".remove-phone").forEach(btn => btn.classList.remove("hidden"));
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
    const sector = document.getElementById("sector").value;
    const phoneText = getFormattedPhones(); // Telefones formatados

  // Captura os dados da unidade
  const unitData = await getUnitData(unit);
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
      ctx.drawImage(logoImage, 40, 40, 150, 75);

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

      // Dados do colaborador
      ctx.font = "bold 14px Arial";
      ctx.fillText(name, 270, 40);
      ctx.font = "14px Arial";
      ctx.fillText(sector, 270, 60);
      ctx.fillText(email, 270, 80);
      ctx.font = "bold 12px Arial";
      if (phoneText) ctx.fillText(phoneText, 270, 170);

        // Outros detalhes (endereço, etc.)
      const formattedAddress = `${address}, ${number}${complement ? ' ' + complement : ''}${neighborhood ? ', ' + neighborhood : ''}`;
      const addressText = `${formattedAddress} ${city} - ${state} CEP: ${cep}`;
      const lineWidth = ctx.measureText(addressText).width;
      const maxLineWidth = canvas.width / scaleFactor - 245 - 40; // Limita a largura
      const actualLineWidth = Math.min(lineWidth, maxLineWidth);
      // Linha horizontal adaptável ao endereço completo
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(270, 105);
      ctx.lineTo(270 + actualLineWidth, 105);
      ctx.stroke();
      ctx.setLineDash([]);

      // Endereço com quebra de linha
      ctx.font = "12px Arial";
      const addressLines = [formattedAddress, `${city} - ${state} CEP: ${cep}`];
      let addrY = 135;

      addressLines.forEach(line => {
          const words = line.split(' ');
          let currentLine = "";
          words.forEach(word => {
              const testLine = currentLine + word + " ";
              const testWidth = ctx.measureText(testLine).width;
              if (testWidth > 450) {
                  ctx.fillText(currentLine, 270, addrY);
                  currentLine = word + " ";
                  addrY += 15;
              } else {
                  currentLine = testLine;
              }
          });
          ctx.fillText(currentLine, 270, addrY);
          addrY += 15;
      });

// Texto de sustentabilidade centralizado com "Meio Ambiente" e "Custos" em negrito
ctx.fillStyle = "#28a745"; // Nova tonalidade de verde
ctx.font = "12px Arial";

// Texto completo dividido em partes
const sustainabilityTextPart1 = "Antes de imprimir, pense em seu compromisso com o ";
const sustainabilityTextBold1 = "Meio Ambiente";
const sustainabilityTextPart2 = " e o comprometimento com os ";
const sustainabilityTextBold2 = "Custos.";

// Calcula a posição inicial para centralizar
const fullText = sustainabilityTextPart1 + sustainabilityTextBold1 + sustainabilityTextPart2 + sustainabilityTextBold2;
const fullTextWidth = ctx.measureText(fullText).width;
const startX = (canvas.width / scaleFactor - fullTextWidth) / 2;
let currentX = startX;

// Renderiza a primeira parte do texto
ctx.fillText(sustainabilityTextPart1, currentX, 220);
currentX += ctx.measureText(sustainabilityTextPart1).width;

// Renderiza "Meio Ambiente" em negrito
ctx.font = "bold 12px Arial";
ctx.fillText(sustainabilityTextBold1, currentX, 220);
currentX += ctx.measureText(sustainabilityTextBold1).width;

// Volta ao estilo normal para a próxima parte
ctx.font = "12px Arial";
ctx.fillText(sustainabilityTextPart2, currentX, 220);
currentX += ctx.measureText(sustainabilityTextPart2).width;

// Renderiza "Custos" em negrito
ctx.font = "bold 12px Arial";
ctx.fillText(sustainabilityTextBold2, currentX, 220);

      // Gera a imagem final
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
  };
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

  // Obter o canvas onde a assinatura foi desenhada
  const canvas = document.getElementById("signature-canvas");
  const imageURL = canvas.toDataURL("image/png"); // Gerar a URL da imagem

  // Criar um link de anexo da imagem no corpo do e-mail
  const attachment = encodeURIComponent(imageURL);

  // Corpo do e-mail
  const emailBody = `
Caro colaborador ${name},

Segue em anexo, sua assinatura e abaixo instruções para adicioná-la no e-mail.

Passos para adiciona/alterar a assinatura via webmail:

1. Clique em **Opções > Redigir > Editar Assinaturas**.
2. Clique no ícone de imagem. 
3. Busque onde você salvou a imagem e selecione-a para uso.

Qualquer dúvida entrar em contato: 
- (071) 99601-8476 (Dionatam)
- (071) 99701-2076 (Alexandre)

Passo a passo: (https://support.microsoft.com/pt-br/office/criar-uma-assinatura-de-e-mail-a-partir-de-um-modelo-5b02c5ed-1e85-4d2a-a098-9628fe3231d8?ui=pt-br&rs=pt-br&ad=br)
  `;

  // Criar o link mailto com o corpo e anexo
  const mailtoLink = `mailto:${email}?subject=Assinatura de E-mail&body=${encodeURIComponent(emailBody)}`;

  // Abrir o cliente de e-mail com o link
  window.location.href = mailtoLink;

  // Exibir um alerta informando que a imagem está anexada
  Swal.fire(
    "Atenção!", 
    "Ao clicar em 'Enviar por E-mail', o seu cliente de e-mail será aberto com a assinatura já anexada. Basta revisar e enviar!", 
    "info"
  );
  
});

// Mostrar o botão "Enviar por E-mail" após a geração da assinatura
document.getElementById("signature-form").addEventListener("submit", (event) => {
  event.preventDefault();

  // Mostrar os botões de download e enviar por e-mail
  document.getElementById("download-button").classList.add("show");
  document.getElementById("send-email-button").classList.add("show");
});