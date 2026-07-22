# Fenix ERP Delphi

Base nova do ERP desktop em Delphi, criada do zero e inspirada apenas nas funcionalidades do sistema legado.

## Objetivo

Construir um sistema profissional, comercial e escalável com:

- Delphi 11+
- VCL desktop
- FireDAC
- PostgreSQL
- APIs REST
- Arquitetura em camadas
- Preparação para expansão futura para web/mobile

## Estrutura

- `docs/`: arquitetura, roadmap e decisões técnicas
- `database/`: modelagem e scripts SQL
- `src/Config/`: configuração do sistema e banco
- `src/Models/`: entidades de domínio
- `src/Views/`: formulários e componentes visuais
- `src/Controllers/`: orquestração entre UI e serviços
- `src/Services/`: regras de aplicação e integrações
- `src/DataModules/`: conexão, queries e infraestrutura FireDAC
- `src/Utils/`: helpers reutilizáveis
- `src/Components/`: componentes visuais próprios
- `src/Reports/`: base para relatórios

## Estado atual

Este scaffold entrega:

- arquitetura inicial
- modelagem PostgreSQL base
- units-base para config, conexão e segurança
- telas mínimas de login e shell principal
- serviço e controller de autenticação
- roadmap para evolução por módulos

## Próximos passos

1. Finalizar autenticação completa com persistência e logs.
2. Implementar módulo de clientes.
3. Implementar módulo de ordens de serviço.
4. Implementar estoque, financeiro e vendas.
5. Estruturar relatórios, integrações e APIs REST.
