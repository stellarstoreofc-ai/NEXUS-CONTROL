// Teste da precificação da Shein (e de que os outros marketplaces não mudaram).
// Rodar com:  node tests/precificacao-shein.test.js
// Extrai as funções de cálculo direto do index.html, então testa o código real.
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const src = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]).join('\n');

function extrairFuncao(nome){
  const i = src.indexOf('function ' + nome + '(');
  if(i < 0) throw new Error('Função não encontrada no index.html: ' + nome);
  let nivel = 0, j = src.indexOf('{', i);
  for(;; j++){
    if(src[j] === '{') nivel++;
    if(src[j] === '}' && --nivel === 0) break;
  }
  return src.slice(i, j + 1);
}
function extrairConst(nome){
  const i = src.indexOf('const ' + nome);
  if(i < 0) throw new Error('Constante não encontrada no index.html: ' + nome);
  return src.slice(i, src.indexOf('];', i) + 2).replace(/^const /, 'var ');
}

const codigo = [
  ...['MARKETPLACE_PRESETS', 'FAIXAS_SHOPEE', 'FAIXAS_TIKTOK'].map(extrairConst),
  ...['custoFixoTotalProduto', 'camposSaoDe', 'comissaoEfetivaProduto', 'descontoSheinProduto', 'descontoValido',
      'percentualDescontosProduto', 'precoRecomendadoProduto', 'resultadoProduto', 'passoAPassoShein',
      'faixasDoMarketplace', 'camposComPreset', 'recomendacaoPreco'].map(extrairFuncao),
  'return { precoRecomendadoProduto, resultadoProduto, passoAPassoShein, recomendacaoPreco, setConfig: c => { configPrecificacao = c; } };'
].join('\n');
const calc = new Function('var configPrecificacao = {};\n' + codigo)();

const r2 = v => Math.round(v * 100) / 100;
let ok = 0;
function teste(nome, fn){
  fn();
  ok++;
  console.log('  ✓ ' + nome);
}

// Só o imposto (4%) vem da config global; o resto zerado pra bater com o exemplo.
calc.setConfig({ imposto: 4, custoEmbalagem: 0, custoFixo: 0, comissaoAfiliado: 0, gerenciamento: 0 });

const sheinBase = { marketplace: 'shein', custoProduto: 40, taxaFixaMarketplace: 0, comissaoMarketplace: 16,
                    descontoShein: 30, lucroDesejado: 15, outrosCustos: [] };

console.log('Shein — teste de conferência (custo 40, desconto 30%, comissão 16%, imposto 4%, margem 15%):');
const precoCheio = r2(calc.precoRecomendadoProduto(sheinBase));
const passo = calc.passoAPassoShein(sheinBase, precoCheio);
console.log(`    preço cheio ${precoCheio} | preço final ${passo.precoFinal} | comissão ${passo.comissao} | imposto ${passo.imposto} | lucro ${passo.lucro} (${passo.margem.toFixed(2)}%)`);
teste('Preço cheio ≈ R$ 87,91', () => assert.strictEqual(precoCheio, 87.91));
teste('Preço final do cliente ≈ R$ 61,54', () => assert.strictEqual(passo.precoFinal, 61.54));
teste('Comissão ≈ R$ 9,85', () => assert.strictEqual(passo.comissao, 9.85));
teste('Imposto ≈ R$ 2,46', () => assert.strictEqual(passo.imposto, 2.46));
teste('Lucro ≈ R$ 9,23 (15%)', () => {
  assert.strictEqual(passo.lucro, 9.23);
  assert.ok(Math.abs(passo.margem - 15) < 0.05, 'margem ' + passo.margem);
});

console.log('Shein — modo inverso (preço cheio informado):');
teste('resultadoProduto bate com o passo a passo', () => {
  const r = calc.resultadoProduto({ ...sheinBase, precoVenda: 87.91 });
  assert.strictEqual(r2(r.precoFinal), 61.54);
  assert.strictEqual(r2(r.lucro), 9.23);
  assert.ok(Math.abs(r.margem - 15) < 0.05);
});
teste('Isenção de comissão (90 dias) zera a comissão', () => {
  const p = { ...sheinBase, isencaoComissaoShein: true };
  const s = calc.passoAPassoShein(p, 87.91);
  assert.strictEqual(s.comissao, 0);
  assert.strictEqual(s.lucro, r2(61.54 - 2.46 - 40));
  // Preço cheio recomendado = 40 / (0,7 × (1 − 0,04 − 0,15)) = 70,55
  assert.strictEqual(r2(calc.precoRecomendadoProduto(p)), 70.55);
});

console.log('Shein — validação:');
teste('Desconto acima de 99% → sem preço (aviso na tela)', () => {
  assert.strictEqual(calc.precoRecomendadoProduto({ ...sheinBase, descontoShein: 100 }), null);
});
teste('Desconto negativo → sem preço', () => {
  assert.strictEqual(calc.precoRecomendadoProduto({ ...sheinBase, descontoShein: -5 }), null);
});
teste('Comissão + imposto + margem ≥ 100% → sem preço', () => {
  assert.strictEqual(calc.precoRecomendadoProduto({ ...sheinBase, comissaoMarketplace: 50, lucroDesejado: 46 }), null);
});
teste('Desconto 0% = fórmula padrão (sem divisão estranha)', () => {
  assert.strictEqual(r2(calc.precoRecomendadoProduto({ ...sheinBase, descontoShein: 0 })), r2(40 / 0.65));
});

console.log('Outros marketplaces continuam iguais (desconto da Shein é ignorado):');
teste('Shopee com descontoShein preenchido usa a fórmula padrão', () => {
  const p = { marketplace: 'shopee', custoProduto: 40, taxaFixaMarketplace: 4.5, comissaoMarketplace: 20,
              descontoShein: 30, isencaoComissaoShein: true, lucroDesejado: 10, outrosCustos: [], precoVenda: 70 };
  assert.strictEqual(r2(calc.precoRecomendadoProduto(p)), r2(44.5 / (1 - 0.20 - 0.04 - 0.10)));
  assert.strictEqual(r2(calc.resultadoProduto(p).lucro), r2(70 - 44.5 - 70 * 0.24));
});
teste('TikTok com tarifa zerada continua zerando só a comissão', () => {
  const p = { marketplace: 'tiktok', custoProduto: 38, taxaFixaMarketplace: 6, comissaoMarketplace: 6, freteMarketplace: 6,
              tarifaZerada: true, descontoShein: 30, lucroDesejado: 10, outrosCustos: [], precoVenda: 60 };
  assert.strictEqual(r2(calc.resultadoProduto(p).lucro), r2(60 - 44 - 60 * 0.10));
});
teste('Mercado Livre ignora isenção da Shein', () => {
  const p = { marketplace: 'ml', custoProduto: 40, taxaFixaMarketplace: 13.85, comissaoMarketplace: 14,
              isencaoComissaoShein: true, lucroDesejado: 10, outrosCustos: [] };
  assert.strictEqual(r2(calc.precoRecomendadoProduto(p)), r2(53.85 / (1 - 0.14 - 0.04 - 0.10)));
});

console.log(`\n${ok} testes passaram.`);
