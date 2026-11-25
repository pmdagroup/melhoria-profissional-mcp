import { test } from 'node:test';
import assert from 'node:assert/strict';
import {analisarIndicadores,verificarViabilidade} from '../src/logica.mjs';

test('calcula métricas comparáveis',()=>{
 const r=analisarIndicadores({faturamento_atual:10000,meta_faturamento:15000,oportunidades:100,vendas:20,mesmo_periodo:true,mesmo_funil:true});
 assert.equal(r.indicadores.diferenca_faturamento,5000);
 assert.equal(r.indicadores.crescimento_faturamento_necessario_percentual,50);
 assert.equal(r.indicadores.ticket_medio_calculado,500);
 assert.equal(r.indicadores.taxa_conversao_percentual,20);
});
test('não calcula conversão se funil não é comparável',()=>{
 const r=analisarIndicadores({oportunidades:10,vendas:20,mesmo_periodo:true,mesmo_funil:true});
 assert.equal(r.indicadores.taxa_conversao_percentual,null);
 assert.match(r.alertas.join(' '),/excedem oportunidades/);
});
test('não inventa crescimento porcentual com base zero',()=>{
 const r=analisarIndicadores({faturamento_atual:0,meta_faturamento:500});
 assert.equal(r.indicadores.crescimento_faturamento_necessario_percentual,null);
 assert.equal(r.indicadores.diferenca_faturamento,500);
});
test('aceita prejuízo mensal, sem confundir com faturamento',()=>{
 const r=analisarIndicadores({lucro_atual:-1000,meta_lucro:1000});
 assert.equal(r.indicadores.diferenca_lucro,2000);
});
test('identifica conflito de capacidade, investimento, risco, tempo e nova oferta',()=>{
 const r=verificarViabilidade({capacidade:'no_limite',novos_produtos:'indisponivel',orcamento:'nenhum',risco_perfil:'conservador',horas_disponiveis_semana:2,propostas:[
 {opcao:1,exige_mais_clientes:true,exige_nova_oferta:true,investimento:'alto',risco:'alto',horas_semana:5}
 ]});
 assert.equal(r.verificacoes[0].status,'conflito');
 assert.equal(r.verificacoes[0].conflitos.length,5);
});
test('sem conflitos identificados não significa recomendação aprovada',()=>{
 const r=verificarViabilidade({capacidade:'alta',novos_produtos:'disponivel',orcamento:'baixo',risco_perfil:'moderado',horas_disponiveis_semana:5,propostas:[
 {opcao:1,exige_mais_clientes:false,exige_nova_oferta:false,investimento:'nenhum',risco:'baixo',horas_semana:1}
 ]});
 assert.equal(r.verificacoes[0].status,'sem_conflito_identificado');
 assert.match(r.observacao,/não aprova/);
});
