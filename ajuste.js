document.getElementById("add-phone-button").addEventListener("click", function() {
  const phoneContainer = document.getElementById("phone-container");
  const phoneInputDiv = document.createElement("div");
  phoneInputDiv.classList.add("phone-input");

  phoneInputDiv.innerHTML = `
      <input type="text" class="phone" placeholder="(00) 90000-0000 ou Fixo: (00) 0000-0000">
      <select class="phone-type">
          <option value="Celular">Celular</option>
          <option value="Fixo">Fixo</option>
      </select>
      <button type="button" class="remove-phone">-</button>
  `;

  phoneContainer.appendChild(phoneInputDiv);

  // Adiciona evento para remover o campo
  phoneInputDiv.querySelector(".remove-phone").addEventListener("click", function() {
      phoneContainer.removeChild(phoneInputDiv);
  });

  // Adiciona evento de formatação ao novo campo
  phoneInputDiv.querySelector(".phone").addEventListener("input", formatPhone);
});

// Função para formatar o telefone
function formatPhone(event) {
  let value = event.target.value.replace(/\D/g, ''); // Remove caracteres não numéricos

  if (value.length > 11) {
      value = value.slice(0, 11); // Limita o tamanho do telefone a 11 dígitos
  }

  // Formata o telefone
  if (value.length > 6) {
      value = value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3'); // Formato (XX) 9XXXX-XXXX
  } else if (value.length > 2) {
      value = value.replace(/(\d{2})(\d)/, '($1) $2'); // Formato (XX) X
  } else if (value.length > 0) {
      value = value.replace(/(\d)/, '($1'); // Formato (X
  }

  event.target.value = value; // Atualiza o valor do campo de entrada
}

// Alterar a função de envio do formulário para coletar todos os telefones
document.getElementById("signature-form").addEventListener("submit", async (event) => {
  event.preventDefault();

  // Captura os dados do formulário
  const unit = document.getElementById("unit").value;
  const name = document.getElementById("name").value;
  const sector = document.getElementById("sector").value;
  const email = document.getElementById("email").value;

  // Coletar todos os telefones
  const phones = Array.from(document.querySelectorAll(".phone")).map(phoneInput => {
      const type = phoneInput.nextElementSibling.value; // Tipo do telefone (Celular/Fixo)
      return `${type}: ${phoneInput.value}`;
  }).filter(phone => phone !== "Celular: " && phone !== "Fixo: "); // Filtra campos vazios

  const phoneString = phones.join(" / "); // Junta os telefones em uma string

  // Resto do código para gerar a assinatura...

  if (phoneString) {
      ctx.fillText(phoneString, 270, 170); // Exibe todos os telefones na assinatura
  }
});