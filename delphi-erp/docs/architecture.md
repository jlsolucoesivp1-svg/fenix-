# Arquitetura Técnica

## Visão geral

O sistema será organizado em camadas com baixo acoplamento:

1. `Views`
   Responsáveis apenas por interação com usuário, binding básico e eventos de tela.

2. `Controllers`
   Coordenam ações da interface, chamam serviços e preparam respostas para a UI.

3. `Services`
   Contêm regras de aplicação, validações, autenticação, orquestração de fluxos e integrações.

4. `Models`
   Entidades e contratos de domínio.

5. `DataModules`
   Infraestrutura de acesso a dados com FireDAC e componentes compartilhados.

6. `Utils`
   Funções utilitárias sem dependência de domínio.

## Estratégia de escalabilidade

- Separar regras de negócio da UI desde o início.
- Centralizar acesso a banco em camadas próprias.
- Preparar o domínio para exposição futura via API REST.
- Evitar lógica SQL embutida em formulários.
- Padronizar respostas de serviço com objetos/records simples.
- Usar IDs `UUID` no banco para facilitar multiempresa e sincronização futura.

## Padrões adotados

- SOLID
- Separation of Concerns
- Dependency inversion gradual via interfaces
- Services por módulo
- Controllers finos
- DataModules de infraestrutura, não de regra

## Stack recomendada

- Delphi 11 Alexandria ou superior
- VCL para a primeira versão desktop
- FireDAC
- PostgreSQL 15+
- JSON via `System.JSON`
- REST via `REST.Client` ou `NetHTTPClient`
- Relatórios via FastReport ou FortesReport

## Componentes Delphi recomendados

- VCL nativa para forms e docking base
- `TSVGIconImageList` para ícones modernos
- `TCardPanel`, `TCategoryButtons`, `TSplitView` para navegação lateral
- `TMS VCL UI Pack` ou `Konopka Signature Controls` se houver licença
- `FastReport VCL` para relatórios comerciais
- `ACBr` para futura NF-e/NFC-e e integrações fiscais

## Diretriz visual

- tema escuro elegante
- tipografia limpa
- sidebar fixa
- cabeçalho reduzido
- cards de indicadores
- animações leves apenas em transições e feedback

## Estrutura de módulos

- Segurança
  - login
  - usuários
  - permissões
  - sessão
  - logs
- Cadastros
  - clientes
  - produtos
  - serviços
- Operação
  - ordens de serviço
  - vendas
  - estoque
  - agenda futura
- Financeiro
  - caixa
  - contas a pagar
  - contas a receber
  - fluxo de caixa
- Gestão
  - dashboard
  - relatórios
  - auditoria
- Integrações
  - WhatsApp
  - REST
  - fiscal futuro
