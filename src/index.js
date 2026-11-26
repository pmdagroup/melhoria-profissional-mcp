import { McpServer, createMcpHandler } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { analisarIndicadores, verificarViabilidade } from './logica.mjs';

const nonNegative = z.number().finite().nonnegative().optional();
const signed = z.number().finite().optional();
const annotations = { readOnlyHint:true, openWorldHint:false, destructiveHint:false };

function createServer() {
  const server = new McpServer({ name:'melhoria-profissional-mcp',version:'0.1.0',
    instructions:'Ferramentas determinísticas para conferir indicadores e restrições comerciais. Sem armazenamento de dados. Nunca produzem sugestões por si só.' });

  server.registerTool('analisar_indicadores', {
    title:'Analisar indicadores do negócio',
    description:'Calcule diferenças de metas, ticket e conversão apenas com dados comparáveis; reporte limitações sem inventar números. Use após a coleta das perguntas financeiras e comerciais. Envie apenas números, jamais nomes ou descrições de clientes.',
    inputSchema:z.object({
      faturamento_atual:nonNegative,meta_faturamento:nonNegative,
      lucro_atual:signed,meta_lucro:signed,oportunidades:nonNegative,vendas:nonNegative,
      ticket_informado:nonNegative,
      mesmo_periodo:z.boolean().optional(),
      mesmo_funil:z.boolean().optional()
    }), annotations
  }, async (args)=>({content:[{type:'text',text:JSON.stringify(analisarIndicadores(args))}]}));

  const propostaSchema=z.object({
    opcao:z.number().int().min(1).max(3),
    exige_mais_clientes:z.boolean(),exige_nova_oferta:z.boolean(),
    investimento:z.enum(['nenhum','baixo','medio','alto']),
    risco:z.enum(['baixo','medio','alto']),
    horas_semana:nonNegative
  });
  server.registerTool('verificar_viabilidade', {
    title:'Verificar viabilidade de melhorias',
    description:'Verifique até três intervenções propostas contra limites reais de capacidade, tempo, dinheiro e risco. Use internamente antes de entregar as três sugestões finais. Envie somente categorias, horas e atributos de cada opção.',
    inputSchema:z.object({
      capacidade:z.enum(['alta','limitada','no_limite','nao_informada']).optional(),
      novos_produtos:z.enum(['disponivel','com_dificuldades','indisponivel','nao_informado']).optional(),
      orcamento:z.enum(['nenhum','baixo','medio_alto','nao_informado']).optional(),
      risco_perfil:z.enum(['conservador','moderado','inovador','nao_informado']).optional(),
      horas_disponiveis_semana:nonNegative,
      propostas:z.array(propostaSchema).min(1).max(3)
    }),annotations
  }, async (args)=>({content:[{type:'text',text:JSON.stringify(verificarViabilidade(args))}]}));
  return server;
}

const handler = createMcpHandler(createServer);
export default {
  fetch(request, env, ctx) {
    const pathname = new URL(request.url).pathname;
    if (pathname === '/health' && request.method === 'GET') {
      return Response.json({ok:true,app:'melhoria-profissional-mcp',version:'0.1.0'});
    }
    if (pathname === '/.well-known/openai-apps-challenge' && request.method === 'GET') {
      // Definir no painel da Cloudflare APENAS após obter o texto exato da OpenAI.
      const challenge = env?.OPENAI_CHALLENGE_CONTENT;
      if (!challenge) return new Response('Not configured',{status:404});
      return new Response(challenge,{headers:{'content-type':'text/plain; charset=utf-8','cache-control':'no-store'}});
    }
    if (pathname !== '/mcp') return new Response('Not Found',{status:404});
    return handler.fetch(request);
  }
};
