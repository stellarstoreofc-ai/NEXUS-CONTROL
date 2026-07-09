# Stellar — Controle Financeiro

Ferramenta para controlar contas a pagar, despesas, faturamento e lembretes de pagamento da empresa. Um único arquivo HTML, com login e dados sincronizados na nuvem via Supabase — acesse de qualquer computador com o mesmo login.

## Configuração inicial (uma vez só)

1. No painel do Supabase do projeto, abra **SQL Editor** e rode o script `supabase-setup.sql` (cria a tabela `financeiro_dados` e as regras de acesso).
2. Abra `index.html` no navegador, clique em **"Criar conta"** e cadastre seu email/senha de acesso.
3. Se o Supabase pedir confirmação por email, confirme pelo link recebido antes de tentar entrar (ou desative essa exigência em Authentication → Providers → Email → "Confirm email", se preferir acesso mais rápido para uso interno).

## Uso

Abra `index.html` diretamente no navegador (local) ou acesse a URL do Netlify depois do deploy. Não precisa de servidor nem build.

## Funcionalidades

- **Contas**: cadastro de despesas/receitas com descrição, valor, vencimento, categoria e status. Painel com totais (a pagar, vencidas, pago no mês, saldo), filtros e busca.
- **Relatório mensal**: faturamento do mês (lançado manualmente), quanto entrou, quanto saiu e saldo — com gráfico comparando o faturamento dos últimos 12 meses.
- **Despesas por categoria**: total, percentual e quebra pago/pendente por categoria, com lista detalhada expansível.
- **Lembretes**: checklist mensal de pagamentos recorrentes (vem pré-cadastrado com contabilidade, ERP, imposto e INSS — dá pra editar, excluir ou adicionar outros), que reseta automaticamente a cada mês.
- **Backup manual**: exporta todos os dados em `.json` e permite restaurar depois — importante como segurança extra além da nuvem.
- **Menu lateral (mobile)**: em telas pequenas a navegação vira um menu "☰" que abre pela lateral.

## Onde ficam os dados

Tudo é salvo na tabela `financeiro_dados` do Supabase, vinculado ao seu usuário de login (protegido por Row Level Security — só quem faz login com a senha certa vê os dados). Ao logar em qualquer computador com o mesmo email/senha, os dados aparecem sincronizados. Cada login tem seus próprios dados, isolados dos demais.

## Deploy no Netlify

Arraste a pasta inteira (`STELLAR CONTROLE FINANCEIRO`) para o Netlify (drag-and-drop em app.netlify.com). Não há build step — é só HTML estático. Depois do deploy, acesse a URL do Netlify de qualquer computador e faça login normalmente.
