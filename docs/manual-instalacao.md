# Manual de Instalacao - Sistema Fenix

Este manual descreve a instalacao e a abertura do Sistema Fenix em ambiente Windows.

## 1. Requisitos

Antes de iniciar, confirme que o computador possui:

- Windows 10 ou superior
- Docker Desktop instalado
- Virtualizacao habilitada na maquina, se exigida pelo Docker Desktop
- Permissao para executar arquivos `.vbs` e `.bat`

Link oficial do Docker Desktop:

`https://www.docker.com/products/docker-desktop/`

## 2. Estrutura dos scripts

Os atalhos principais do sistema ficam na pasta `scripts`:

- `01-instalar-sistema.vbs`: instala e inicia o sistema
- `02-abrir-sistema.vbs`: garante que o sistema esteja em execucao e abre no navegador
- `03-parar-sistema.vbs`: encerra os containers do sistema

As ferramentas auxiliares e scripts tecnicos ficam na pasta `ferramentas`.

## 3. Instalacao do sistema

1. Extraia a pasta do sistema em um local do computador.
2. Abra a pasta `scripts`.
3. De duplo clique em `01-instalar-sistema.vbs`.
4. Aguarde a verificacao do Docker Desktop.
5. Aguarde a criacao e inicializacao dos containers.

Ao final da instalacao, o sistema sera disponibilizado em:

`http://localhost:3001`

## 4. Abrir o sistema depois da instalacao

Para abrir novamente o sistema:

1. Acesse a pasta `scripts`.
2. Execute `02-abrir-sistema.vbs`.

Esse script:

- verifica se o Docker Desktop esta instalado
- tenta iniciar o Docker Desktop, se necessario
- sobe os containers do sistema
- abre o sistema no navegador

## 5. Parar o sistema

Para encerrar o sistema:

1. Acesse a pasta `scripts`.
2. Execute `03-parar-sistema.vbs`.

Esse script executa `docker compose down` e para os containers da aplicacao.

## 6. Liberacao da instalacao

1. Na primeira abertura, a tela inicial exibira automaticamente a chave desta instalacao.
2. Copie a chave e envie para o responsavel pelo ativador externo.
3. Receba o codigo de ativacao gerado externamente.
4. Cole o codigo na tela inicial e clique em `Liberar sistema`.
5. Depois disso, o login normal sera liberado.

## 7. Diagnostico de problemas comuns

### Nada acontece ao executar o arquivo

Verifique:

- se o arquivo foi extraido corretamente
- se o Windows bloqueou a execucao do arquivo
- se o antivirus impediu a abertura do script
- se o Docker Desktop esta instalado

Se necessario, teste o `.bat` correspondente diretamente, por exemplo:

`ferramentas/01-instalar-sistema.bat`

Assim a mensagem de erro fica visivel no terminal.

### Docker Desktop nao encontrado

Instale o Docker Desktop e execute novamente o instalador.

### Docker Desktop nao iniciou a tempo

Abra o Docker Desktop manualmente, aguarde ele ficar totalmente pronto e rode o script novamente.

### Porta 3001 em uso

Se `http://localhost:3001` nao abrir, pode haver outro programa usando a porta. Feche o outro programa ou ajuste o mapeamento de portas em `docker-compose.yml`.

## 8. Execucao manual alternativa

Se preferir executar sem os atalhos:

1. Abra o PowerShell na pasta raiz do projeto.
2. Execute:

```powershell
docker compose up --build -d
```

3. Abra no navegador:

`http://localhost:3001`

Para parar manualmente:

```powershell
docker compose down
```

## 9. Observacao tecnica

Este projeto tambem possui arquivos para execucao em modo de desenvolvimento com Node.js, mas o fluxo principal de instalacao entregue ao usuario final nesta pasta e o uso via Docker.
