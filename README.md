# Nexus Control

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
- **Custo fixo por pedido**: calculadora que divide o custo fixo total do mês pela quantidade média de pedidos, com atalho pra puxar automaticamente o total de despesas da categoria "Fixas" pagas no mês.
- **Precificação de produtos**: cadastro de produtos com custo do produto, custo fixo da operação (puxado automaticamente da calculadora acima), taxa fixa de marketplace, comissão de marketplace e de afiliado, imposto, embalagem, ads e outros custos personalizados. Ao escolher o campo "Marketplace" (Shopee, Mercado Livre, Shein ou TikTok Shop), a taxa fixa e a comissão já vêm preenchidas com valores de referência daquele marketplace — ainda editáveis manualmente. Mostra em tempo real a margem de contribuição, o lucro no preço de venda informado, e o preço recomendado para atingir a meta de lucro (padrão 10%).
  - Taxas de referência usadas: **Shopee** 18% + R$4 · **Mercado Livre** 19% + R$6,75 · **Shein** 18% + R$5 · **TikTok Shop** 16% + R$4 (produto até R$50) ou 12% + R$6 (acima de R$50). Confirme sempre com as taxas reais da sua conta, pois variam por categoria/plano e mudam com frequência.
  - No TikTok Shop só existe uma opção no seletor — a faixa de comissão (até/acima de R$50) é detectada **automaticamente** pelo preço de venda que você digitar, não tem escolha manual de faixa.
  - Também tem uma calculadora rápida no topo da mesma página, com abas sempre coloridas por marketplace (Shopee laranja, Mercado Livre amarelo, Shein azul, TikTok preto), sem precisar salvar um produto.
- **Backup manual**: exporta todos os dados em `.json` e permite restaurar depois — importante como segurança extra além da nuvem.
- **Menu lateral (mobile)**: em telas pequenas a navegação vira um menu "☰" que abre pela lateral.

## Onde ficam os dados

Tudo é salvo na tabela `financeiro_dados` do Supabase, vinculado ao seu usuário de login (protegido por Row Level Security — só quem faz login com a senha certa vê os dados). Ao logar em qualquer computador com o mesmo email/senha, os dados aparecem sincronizados. Cada login tem seus próprios dados, isolados dos demais.

## Deploy no Netlify

Arraste a pasta inteira (`NEXUS CONTROL`) para o Netlify (drag-and-drop em app.netlify.com) — ou conecte o repositório do GitHub na Vercel, como já está sendo usado. Não há build step — é só HTML estático. Depois do deploy, acesse a URL de qualquer computador e faça login normalmente.
