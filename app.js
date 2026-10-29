const form = document.getElementById("formCadastro");
const mensagem = document.getElementById("mensagem");
const botao = document.getElementById("btnCadastrar");

const campoNascimento = document.getElementById("nascimento");
const campoCPF = document.getElementById("cpf");
const campoCelular = document.getElementById("celular");

// Define a data máxima de nascimento para quem tem pelo menos 18 anos.
function definirDataMaxima() {
    const hoje = new Date();

    hoje.setFullYear(hoje.getFullYear() - 18);

    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    const dia = String(hoje.getDate()).padStart(2, "0");

    campoNascimento.max = `${ano}-${mes}-${dia}`;
}

definirDataMaxima();

// Exibe mensagens sem utilizar innerHTML.
function mostrarMensagem(texto, tipo) {
    mensagem.textContent = texto;
    mensagem.className = `mensagem ${tipo}`;
}

// Limpa a mensagem anterior.
function limparMensagem() {
    mensagem.textContent = "";
    mensagem.className = "mensagem";
}

// Valida o formato do e-mail.
function emailValido(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Exige pelo menos 8 caracteres, uma letra e um número.
function senhaValida(senha) {
    return senha.length >= 8 &&
        /[A-Za-zÀ-ÿ]/.test(senha) &&
        /[0-9]/.test(senha);
}

// Calcula a idade considerando o dia e o mês de nascimento.
function idadeValida(dataNascimento) {
    if (!dataNascimento) return false;

    const nascimento = new Date(`${dataNascimento}T00:00:00`);
    const hoje = new Date();

    if (Number.isNaN(nascimento.getTime())) return false;
    if (nascimento > hoje) return false;

    let idade = hoje.getFullYear() - nascimento.getFullYear();

    const aindaNaoFezAniversario =
        hoje.getMonth() < nascimento.getMonth() ||
        (
            hoje.getMonth() === nascimento.getMonth() &&
            hoje.getDate() < nascimento.getDate()
        );

    if (aindaNaoFezAniversario) idade--;

    return idade >= 18;
}

// Valida o CPF pelos dígitos verificadores.
function cpfValido(valor) {
    const cpf = valor.replace(/\D/g, "");

    if (!/^\d{11}$/.test(cpf)) return false;

    // Rejeita sequências como 111.111.111-11.
    if (/^(\d)\1{10}$/.test(cpf)) return false;

    let soma = 0;

    for (let i = 0; i < 9; i++) {
        soma += Number(cpf[i]) * (10 - i);
    }

    let resto = (soma * 10) % 11;

    if (resto === 10) resto = 0;

    if (resto !== Number(cpf[9])) return false;

    soma = 0;

    for (let i = 0; i < 10; i++) {
        soma += Number(cpf[i]) * (11 - i);
    }

    resto = (soma * 10) % 11;

    if (resto === 10) resto = 0;

    return resto === Number(cpf[10]);
}

// Formata o CPF enquanto o usuário digita.
campoCPF.addEventListener("input", () => {
    let valor = campoCPF.value.replace(/\D/g, "").slice(0, 11);

    valor = valor
        .replace(/^(\d{3})(\d)/, "$1.$2")
        .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
        .replace(/\.(\d{3})(\d)/, ".$1-$2");

    campoCPF.value = valor;
});

// Formata o celular para facilitar a digitação.
campoCelular.addEventListener("input", () => {
    let numeros = campoCelular.value.replace(/\D/g, "").slice(0, 11);

    if (numeros.length > 10) {
        numeros = numeros.replace(
            /^(\d{2})(\d{5})(\d{0,4}).*/,
            "($1) $2-$3"
        );
    } else if (numeros.length > 6) {
        numeros = numeros.replace(
            /^(\d{2})(\d{4})(\d{0,4}).*/,
            "($1) $2-$3"
        );
    } else if (numeros.length > 2) {
        numeros = numeros.replace(
            /^(\d{2})(\d+)/,
            "($1) $2"
        );
    }

    campoCelular.value = numeros;
});

// Limpa mensagens quando o usuário modifica os campos.
form.addEventListener("input", limparMensagem);
form.addEventListener("change", limparMensagem);

form.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    limparMensagem();

    const nome = document.getElementById("nome").value.trim();
    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value;
    const nascimento = campoNascimento.value;
    const celular = campoCelular.value.trim();
    const cpf = campoCPF.value.trim();

    const aceiteTermos =
        document.getElementById("aceiteTermos").checked;

    const ofertasEmail =
        document.getElementById("ofertasEmail").checked;

    const ofertasWhatsApp =
        document.getElementById("ofertasWhatsApp").checked;

    // Validações antes de enviar ao servidor.
    if (!nome) {
        mostrarMensagem("Informe seu nome completo.", "erro");
        return;
    }

    if (!emailValido(email)) {
        mostrarMensagem("Informe um e-mail válido.", "erro");
        return;
    }

    if (!senhaValida(senha)) {
        mostrarMensagem(
            "A senha deve ter pelo menos 8 caracteres, incluindo letras e números.",
            "erro"
        );
        return;
    }

    if (!idadeValida(nascimento)) {
        mostrarMensagem(
            "Você precisa ter pelo menos 18 anos para se cadastrar.",
            "erro"
        );
        return;
    }

    if (cpf && !cpfValido(cpf)) {
        mostrarMensagem(
            "O CPF informado é inválido. Confira os números ou deixe o campo vazio.",
            "erro"
        );
        return;
    }

    if (!aceiteTermos) {
        mostrarMensagem(
            "É necessário aceitar os Termos de Uso e a Política de Privacidade.",
            "erro"
        );
        return;
    }

    // O servidor deve validar tudo novamente.
    const dados = {
        nome,
        email,
        senha,
        dataNascimento: nascimento,
        celular: celular || null,
        cpf: cpf ? cpf.replace(/\D/g, "") : null,
        aceiteTermos,
        ofertasEmail,
        ofertasWhatsApp
    };

    botao.disabled = true;
    botao.textContent = "Cadastrando...";

    try {
        const resposta = await fetch("/api/cadastro", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(dados)
        });

        // Trata respostas JSON e evita exibir erros internos do banco.
        let resultado;

        try {
            resultado = await resposta.json();
        } catch {
            resultado = {};
        }

        if (!resposta.ok) {
            const mensagensPermitidas = {
                "DADOS_INVALIDOS": "Confira os dados informados.",
                "EMAIL_EXISTENTE": "Este e-mail já está cadastrado.",
                "CPF_INVALIDO": "O CPF informado é inválido.",
                "IDADE_MINIMA": "É necessário ter pelo menos 18 anos.",
                "TERMOS_OBRIGATORIOS":
                    "É necessário aceitar os termos para continuar."
            };

            const codigo = resultado.codigo;
            const texto = mensagensPermitidas[codigo] ||
                "Não foi possível realizar o cadastro. Tente novamente.";

            mostrarMensagem(texto, "erro");
            return;
        }

        mostrarMensagem(
            "Cadastro realizado com sucesso! Você já pode fazer login.",
            "sucesso"
        );

        form.reset();
        definirDataMaxima();

        // Se preferir redirecionar automaticamente, use:
        // window.location.href = "login.html";

    } catch {
        mostrarMensagem(
            "Não foi possível conectar ao servidor. Tente novamente.",
            "erro"
        );
    } finally {
        botao.disabled = false;
        botao.textContent = "Criar minha conta";
    }
});
