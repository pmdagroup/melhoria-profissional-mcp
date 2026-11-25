# Servidor MCP do Melhoria Profissional

Projeto independente, sem banco de dados, sem API de IA e sem autenticação de usuário. O servidor oferece **dois instrumentos determinísticos**: `analisar_indicadores` e `verificar_viabilidade`. O texto privado da Skill **NÃO faz parte deste repositório**.

## Publicar com GitHub + Cloudflare Workers

1. No GitHub, crie **outro repositório** chamado `melhoria-profissional-mcp` (separado de `melhoria-profissional-site`). Um repositório público expõe o código do servidor, mas **não o prompt**, que não está aqui.
2. Envie **somente o conteúdo desta pasta `servidor-cloudflare`** para a raiz do repositório (arquivos `package.json`, `wrangler.jsonc`, `src/`, `tests/`). Não envie o ZIP inteiro, não publique `plugin-template-privado` e não inclua segredos.
3. No painel Cloudflare, crie uma conta gratuita; em **Workers & Pages → Create application**, escolha conectar o GitHub, selecione o repositório e use o nome `melhoria-profissional-mcp`, igual ao `name` de `wrangler.jsonc`.
4. Configurações usuais: projeto na raiz `/`, branch `main`; comando de deploy `npx wrangler deploy`. O instalador deve instalar dependências com `npm install`.
5. Após `Save and Deploy`, abra `https://<nome>.<conta>.workers.dev/health`; deve mostrar `ok: true`. A rota `/mcp` deve ser testada com um cliente MCP (não basta abrir no navegador).
6. Envie ao assistente **somente o endereço público do Worker**, não senhas ou tokens. Ele poderá finalizar um novo ZIP de submissão com esse URL.

## Verificação de domínio exigida pelo portal

Quando o portal pedir o desafio, copie o valor exato e configure uma variável/segredo `OPENAI_CHALLENGE_CONTENT` nas configurações do Worker; reprocesse a implantação, se necessário. O endpoint `/.well-known/openai-apps-challenge` devolverá a string como texto puro, sem cache. Confira o endereço mostrado pelo portal, pois poderá usar um host permitido específico.

Nunca adicione o token ao código publicado no GitHub.

## Testar localmente (opcional)

Requer Node.js 20+ e npm:

```sh
npm install
npm test
npm run dev
```

Teste com MCP Inspector apontando para `http://localhost:8787/mcp` ou a porta mostrada pelo Wrangler. Para publicar via terminal, `npm run deploy` após autenticar-se no Cloudflare com o Wrangler.

## Segurança e limites

- A versão inicial está **sem autenticação**, adequada apenas a cálculos sem consulta a dados persistentes; qualquer cliente pode chamar a ferramenta se conhecer o URL. Não dá acesso a contas, fichas de clientes ou bases de dados.
- O Worker recebe números, categorias e atributos das propostas. Evite enviar nomes, dados pessoais e conteúdo livre do negócio.
- O Worker não persiste dados de entrada nem registra o corpo dos pedidos em seu código. Serviços de infraestrutura podem gerar seus próprios registros técnicos; revisar a política e a configuração antes do uso público.
- Mensagens do ChatGPT permanecem sujeitas às configurações da conta e às políticas da plataforma.
- Esta é uma implementação candidata; a execução completa do protocolo MCP precisa ser testada após instalar dependências e publicar o Worker. **O serviço ainda não foi implantado.**
- Revisão e publicação pela OpenAI são etapas separadas, sem garantia de aprovação.
