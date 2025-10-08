# share_to_webhooks

Um mini-servidor para receber atalhos compartilhados pelo app [HTTP Shortcuts](https://github.com/Waboodoo/HTTP-Shortcuts) e postar em webhooks para o Discord.

## Visão Geral do Projeto

Este projeto implementa um microserviço que atua como intermediário entre o aplicativo Android [HTTP Shortcuts](https://github.com/Waboodoo/HTTP-Shortcuts) e os webhooks do Discord. O fluxo de dados funciona da seguinte forma:

1. O usuário envia uma requisição HTTP via HTTP Shortcuts no Android.
2. O servidor Node.js recebe a requisição, processa os dados e realiza validações.
3. O servidor encaminha os dados para o webhook do Discord configurado, permitindo a publicação de mensagens ou arquivos.

Este fluxo é otimizado para suportar casos especiais, como o download de links do Instagram utilizando o `yt-dlp` e o envio de mensagens para canais do tipo fórum no Discord.

> **Nota:** Este é um projeto pessoal e, portanto, não foi testado em todos os cenários possíveis, como diferentes versões do HTTP Shortcuts, versões do Android ou redes.

## Pré-requisitos

Antes de começar, certifique-se de que você possui os seguintes requisitos atendidos:

- **Hardware**: Raspberry Pi 3b+ ou superior.
- **Software**:
  - Node.js (versão recomendada: 18.x ou superior).
  - `yt-dlp` instalado e disponível no `PATH` do sistema.
- **Rede**: Acesso à internet para baixar dependências e interagir com os webhooks do Discord.

## Passos de Instalação

1. **Clone o repositório**:
   ```bash
   git clone https://github.com/seu-usuario/share_to_webhooks.git
   cd share_to_webhooks
   ```

2. **Instale as dependências**:
   ```bash
   npm install
   ```

3. **Configure o arquivo `config.json`**:
   - Copie o arquivo de exemplo:
     ```bash
     cp config.example.json config.json
     ```
   - Edite o arquivo `config.json` para ajustar os valores conforme necessário (veja a seção de [Referência de Configuração](#referência-de-configuração)).

4. **(Opcional) Configure variáveis de ambiente**:
   - Caso necessário, defina variáveis de ambiente específicas para o ambiente de execução.

## Referência de Configuração

O arquivo `config.json` contém os seguintes campos:

### Bloco `server`
- **`host`**: Endereço de IP onde o servidor será executado. Exemplo: `"0.0.0.0"`.
- **`port`**: Porta onde o servidor estará disponível. Exemplo: `3000`.

### Bloco `media`
- **`tempDir`**: Diretório temporário para armazenar arquivos baixados. Exemplo: `"./temp"`.
- **`maxFileSize`**: Tamanho máximo permitido para arquivos, em bytes. Exemplo: `8388608` (8 MiB).

### Bloco `endpoints` (Array de objetos)
Cada objeto no array define um endpoint configurado:
- **`path`**: Caminho do endpoint. Exemplo: `"/share/general"`.
- **`webhookUrl`**: URL do webhook do Discord associado ao endpoint.
- **`isForumChannel`**: Indica se o webhook está associado a um canal do tipo fórum. Valores possíveis: `true` ou `false`.
- **`name`**: Nome descritivo do endpoint. Exemplo: `"General Channel"`.

## Execução do Serviço

Para iniciar o servidor, utilize o seguinte comando:

```bash
npm start
```

Por padrão, o servidor será executado no host e porta definidos no arquivo `config.json`. O log do console exibirá mensagens indicando o status do servidor, incluindo a inicialização e quaisquer erros encontrados.

### Scripts Disponíveis

- **`npm start`**: Inicia o servidor em modo de produção.
- **`npm run dev`**: Inicia o servidor em modo de desenvolvimento, com recarregamento automático.
- **`npm test`**: Executa os testes automatizados.

## Instruções de Uso com HTTP Shortcuts

### Exemplo de Payload POST

Envie uma requisição POST para um dos endpoints configurados no `config.json`. Exemplo de payload:

```json
{
  "url": "https://www.instagram.com/p/xyz123/",
  "thread_name": "Discussão sobre o post",
  "message": "Confira este link!"
}
```

### Comportamento Especial para Links do Instagram

- Links do Instagram são processados utilizando o `yt-dlp` para realizar o download do conteúdo.
- Limite de tamanho: 8 MiB. Caso o arquivo exceda este limite, o servidor retornará ao fallback configurado.

### Canais do Tipo Fórum

Para canais do tipo fórum, o campo `thread_name` é obrigatório no payload. Este campo será utilizado para criar ou identificar a thread onde a mensagem será postada.

## Considerações Operacionais

- **Gerenciamento do Diretório Temporário**: O diretório configurado em `tempDir` é utilizado para armazenar arquivos baixados temporariamente. Certifique-se de que o diretório possui espaço suficiente.
- **Política de Limpeza**: Arquivos no diretório temporário são limpos periodicamente com base no intervalo configurado em `cleanupInterval`.
- **Estrutura de Logs**: O servidor gera logs detalhados para monitorar o status das requisições e identificar erros.
- **Tratamento de Erros e Fallbacks**: Em caso de falhas, o servidor tenta aplicar estratégias de fallback, como retornar mensagens de erro claras ou reprocessar requisições.

## Guia de Testes

Para rodar os testes automatizados, utilize o comando:

```bash
npm test
```

Os testes incluem mocks para o `yt-dlp` e os webhooks do Discord, garantindo que o comportamento do servidor seja validado sem dependências externas.

## Boas Práticas de Segurança

- **Limitar Acesso à Rede Local**: Configure o servidor para aceitar conexões apenas da rede local, se possível.
- **Proteger URLs de Webhook**: Certifique-se de que as URLs dos webhooks do Discord não sejam expostas publicamente.
- **Validação de URLs de Entrada**: Sempre valide as URLs recebidas no payload para evitar abusos ou ataques.

## Dicas de Troubleshooting

- **`yt-dlp` ausente**: Certifique-se de que o `yt-dlp` está instalado e disponível no `PATH` do sistema.
- **Falhas na coleta de metadata**: Verifique se o link fornecido é válido e acessível.
- **Erros da API do Discord**: Confirme se a URL do webhook está correta e se o canal associado está ativo.
