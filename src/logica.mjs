// Cálculos puros do Melhoria Profissional. Não armazena nem transmite dados.
const present = (v) => v !== undefined && v !== null;
const rounded = (v, decimals=2) => Math.round((v + Number.EPSILON) * 10**decimals) / 10**decimals;
const okNum = v => !present(v) || (typeof v === 'number' && Number.isFinite(v));
const allowNonNegative = (value, key, alerts) => {
  if (!present(value)) return;
  if (!okNum(value) || value < 0) alerts.push(`${key}: deve ser um número não negativo.`);
};

export function analisarIndicadores(dados={}) {
  const alerts = [];
  const result = {
    diferenca_faturamento: null,
    crescimento_faturamento_necessario_percentual: null,
    diferenca_lucro: null,
    ticket_medio_calculado: null,
    taxa_conversao_percentual: null,
  };
  const {
    faturamento_atual, meta_faturamento, lucro_atual, meta_lucro,
    oportunidades, vendas, ticket_informado, mesmo_periodo, mesmo_funil
  } = dados;
  for (const key of ['faturamento_atual','meta_faturamento','oportunidades','vendas','ticket_informado']) {
    allowNonNegative(dados[key],key, alerts);
  }
  for (const key of ['lucro_atual','meta_lucro']) {
    if (!okNum(dados[key])) alerts.push(`${key}: informe um número finito.`);
  }
  if (alerts.some(x=>x.includes('deve ser') || x.includes('número finito'))) {
    return {indicadores:result,alertas:alerts,observacoes:['Dados inválidos: cálculos não executados.']};
  }
  if (present(faturamento_atual) && present(meta_faturamento)) {
    result.diferenca_faturamento=rounded(meta_faturamento - faturamento_atual);
    if (faturamento_atual > 0) result.crescimento_faturamento_necessario_percentual=rounded((meta_faturamento/faturamento_atual-1)*100);
    else if (meta_faturamento>0) alerts.push('Crescimento percentual indefinido: faturamento atual é zero.');
  }
  if (present(lucro_atual) && present(meta_lucro)) {
    result.diferenca_lucro = rounded(meta_lucro - lucro_atual);
    alerts.push('Diferença de lucro pressupõe que o lucro informado inclua todos os custos e despesas relevantes.');
  }
  if (present(faturamento_atual) && present(vendas)) {
    if (mesmo_periodo === true && vendas > 0) {
      result.ticket_medio_calculado=rounded(faturamento_atual/vendas);
      if (present(ticket_informado) && ticket_informado>0 && Math.abs(result.ticket_medio_calculado-ticket_informado)/ticket_informado > .15) {
        alerts.push('Ticket informado diverge do calculado em mais de 15%; verificar período ou definição de venda.');
      }
    } else if (vendas===0 && faturamento_atual>0) {
      alerts.push('Faturamento positivo com zero vendas registradas: confirmar origem das receitas e registros.');
    } else if (mesmo_periodo!==true) {
      alerts.push('Ticket médio não calculado: comparabilidade temporal não confirmada.');
    }
  }
  if (present(oportunidades) && present(vendas)) {
    if (mesmo_periodo !== true || mesmo_funil !== true) {
      alerts.push('Conversão não calculada: confirmar mesmo período e mesmo funil de oportunidades e vendas.');
    } else if (oportunidades <= 0) {
      alerts.push('Conversão não calculada: número de oportunidades igual a zero.');
    } else if (vendas > oportunidades) {
      alerts.push('Conversão não calculada: vendas excedem oportunidades; verificar outros canais ou contagens.');
    } else {
      result.taxa_conversao_percentual=rounded(100*vendas/oportunidades);
    }
  }
  return {indicadores:result, alertas:alerts,observacoes:[
    'Resultados são descritivos; não comprovam causas, gargalos ou ganhos futuros.',
    'Faturamento não é lucro. Custos parciais não representam lucro líquido.',
    'Nenhuma taxa de conversão deve ser julgada alta/baixa sem contexto.'
  ]};
}

const rankInvestimento = {nenhum:0,baixo:1,medio:2,alto:3};
const rankRisco = {baixo:0,medio:1,alto:2};
export function verificarViabilidade(dados={}) {
  const {capacidade='nao_informada',novos_produtos='nao_informado',orcamento='nao_informado',
    risco_perfil='nao_informado',horas_disponiveis_semana,propostas=[]} = dados;
  return {
    verificacoes: propostas.map((proposta)=>{
      const alerta=[],conflito=[];
      if (capacidade==='no_limite' && proposta.exige_mais_clientes) conflito.push('O negócio está no limite de atendimento; exigir mais clientes pode não ser executável.');
      if (capacidade==='limitada' && proposta.exige_mais_clientes) alerta.push('Capacidade adicional é limitada: testar a demanda antes de ampliar vendas.');
      if (novos_produtos==='indisponivel' && proposta.exige_nova_oferta) conflito.push('Não há disponibilidade para criar nova oferta.');
      if (novos_produtos==='com_dificuldades' && proposta.exige_nova_oferta) alerta.push('Criar nova oferta enfrenta dificuldades declaradas.');
      const limiteOrc = {nenhum:0,baixo:1,medio_alto:3};
      if (Object.hasOwn(limiteOrc,orcamento) && rankInvestimento[proposta.investimento] > limiteOrc[orcamento]) {
        conflito.push('Investimento exigido supera a disponibilidade financeira declarada.');
      }
      if (risco_perfil==='conservador' && rankRisco[proposta.risco] >= 2) conflito.push('Alto risco conflita com o perfil conservador.');
      if (risco_perfil==='conservador' && rankRisco[proposta.risco] === 1) alerta.push('Risco médio requer adaptação a teste pequeno e reversível.');
      if (present(horas_disponiveis_semana) && present(proposta.horas_semana) && proposta.horas_semana>horas_disponiveis_semana) {
        conflito.push('Tempo estimado da proposta excede a disponibilidade semanal declarada.');
      }
      if (!present(horas_disponiveis_semana) && present(proposta.horas_semana)) alerta.push('Tempo disponível não informado; não é possível confirmar adequação da dedicação.');
      return {opcao:proposta.opcao, status:conflito.length?'conflito':alerta.length?'atencao':'sem_conflito_identificado',conflitos:conflito,alertas:alerta};
    }),
    observacao:'Verificação baseada em restrições declaradas; não aprova propostas nem prevê resultados.'
  };
}
