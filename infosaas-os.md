# Infosaas OS™ (1)

## Base de Instalação

- 📁 infosaas_OS/
    - 📁 .claude/ *← base de instruções para o Claude*
        - 📁 skills/ *← habilidades específicas para agentes*
    
    📄 AGENTS.md *← regras gerais (toda IDE de IA lê esse arquivo primeiro)*
    
    - 📁 dna/ *← base de conhecimento da empresa*
        - 📁 ativos/ *← arquivos de logo, fotos, fontes, branding, identidade visual*
        - 📁 empresa/ *← documentos de base de conhecimento da empresa*
            
            📄 EMPRESA.md *← o que faz, pra quem, números*
            📄 TIME.md *← quem trabalha aqui, quem decide o quê*
            📄 VOZ.md *← como a empresa fala e escreve*
            📄 DESIGN.md *← cores, fontes, regras de logo*
            📄 POSICIONAMENTO.md *← posicionamento de mercado direcionado da empresa*
            
        - 📁 perfil-de-cliente-ideal/ *← documentos de base de conhecimento dos ICPS da empresa*
            
            📄 ICPS.md *← descrição dos perfis de cliente ideal da empresa*
            📄 PERSONAS.md *← exemplos de 03 personas dos ICPs*
            📄 DUALIDADE.md *← problemas x desejos comuns dos ICPs*
            📄 PROBLEMAS-PRINCIPAIS.md *← definição dos principais problemas dos ICPS*
            📄 URGENCIAS-OCULTAS.md *← definição das urgências ocultas dos ICPS*
            
        - 📁 produtos/ *← documentos de base de conhecimento dos produtos da empresa*
            - 📁 produto-a/
                
                📄 RELEASE.md *← descrição resumida sobre o produto*
                📄 PROBLEMA.md *← descrição sobre os problemas que esse produto resolve*
                📄 SOLUÇÕES.md *← descrição sobre as soluções que esse produto resolve*
                📄 BENEFICIOS.md *← descrição sobre os benefícios que esse produto gera*
                📄 TRANSFORMACOES.md *← descrição sobre as transformações que esse produto entrega*
                📄 CRENCAS.md *← descrição sobre as novas crenças que esse produto gera*
                📄 DEPOIMENTOS.md *← histórico de depoimentos recebidos do produto*
                📄 OBJEÇÕES.md *← descrição sobre como vencer as objeções do produto*
                📄 OFERTAS.md *← registro de ofertas especiais de campanhas do produto*
                
    - 📁 clientes/ *← base de conhecimento e registro histórico de clientes*
    - 📁 marketing/ *← base de conhecimento e registro histórico do marketing*
        - 📁 conteudo/ *← base estrutural para produção de conteúdo*
            - 📁 plataforma-a/ *← base estrutural de alguma plataforma de conteúdo (instagram, linkedin e etc…)*
                - 📁 ideias/ *← base de conhecimento e registro histórico de ideias para conteúdos*
                - 📁 criacoes/ *← base de conhecimento e registro histórico de conteúdos criados*
                    - 📁 skills/ *← base de conhecimento e registro histórico de conteúdos criados*
                        
                        📄 DESCOBERTA.md *← capaz de elaborar conteúdos para públicos que estão na fase de descoberta*
                        📄 RELACIONAMENTO.md *← capaz de elaborar conteúdos para públicos que estão na fase de relacionamento*
                        📄 PRONTIDÃO.md *← capaz de elaborar conteúdos para públicos que estão na fase de prontidão*
                        
                - 📁 aprovacoes/ *← registro histórico de aprovações de conteúdo*
                - 📁 agendadas/ *← registro histórico de conteúdos agendados*
                - 📁 publicadas/ *← registro histórico de conteúdos publicados*
    - 📁 ferramentas/ *← base estrutural de ferramentas da empresa*
        - 📁 apps/ *← onde todo e qualquer app construido deverá ser armazenado*
        - 📁 automacoes/ *← onde toda e qualquer automação construida deverá ser armazenada*
        - 📁 integracoes/ *← onde toda e qualquer integração construida deverá ser armazenada*
        - 📁 mcps/ *← onde toda e qualquer conexão mcp deverá ser armazenada*
            
            📄 mcp.json *← conexões com ferramentas externas*
            

### Regras para gerar os arquivos:

- **Use os dados reais que eu te passar.** Se eu deixar uma pergunta em branco, escreva no arquivo correspondente uma marcação clara como > A definir — preencher antes de usar com IA no lugar do conteúdo, em vez de inventar.
- **A pasta dna/ vai conter todo o contexto e conhecimento necessário da empresa**.
    - Dentro de ativos/ : deverá conter todos os arquivos de logo, fontes, fotos, branding e identidade visual.
    - Dentro de empresa/ : deverá conter toda a base de conhecimento da empresa.
    - Dentro de perfil-de-cliente-ideal/ : deverá conter toda a base de conhecimento dos ICPS da empresa.
    - Dentro de produtos/ : deverá conter toda a base de conhecimento dos produtos da empresa.
- **Crie um mcp.json mínimo dentro da pasta /ferramentas/mcps/:** apenas {} por enquanto.
- **Crie a pasta .claude/skills/ vazia.**
- **Crie a pasta dna/ativos/ vazia.**
- **Crie a pasta dna/clientes/ vazia.**
- **Crie a pasta dna/marketing/conteudo/plataforma-a/ideias/ vazia.**
- **Crie a pasta dna/marketing/conteudo/plataforma-a/aprovacoes/ vazia.**
- **Crie a pasta dna/marketing/conteudo/plataforma-a/agendadas/ vazia.**
- **Crie a pasta dna/marketing/conteudo/plataforma-a/publicadas/ vazia.**
- **Crie a pasta dna/marketing/conteudo/plataforma-a/criacoes/skills/** com 03 arquivos de skills para produção de conteúdo: DESCOBERTA.md, RELACIONAMENTO.md E PRONTIDÃO.md. Ajude o usuário a definir como será a comunicação em cada skill.
- **Crie a pasta dna/ativos/** com um README.md listando os arquivos de marca que devem ir ali (logos, fotos institucionais, fontes, templates).
- **Para criar o AGENTS.md cada arquivo .md dentro das pastas empresa/ , perfil-de-cliente-ideal/ , produtos/, dna/marketing/conteudo/plataforma-a/criacoes/skills/**  precisam ser devidamente preenchidos e definido junto ao usuário, um a um, para que você possa entender todo o contexto necessário e criar o AGENTS.md.
- **Crie a pasta ferramentas/apps/ vazia.**
- **Crie a pasta ferramentas/automacoes/ vazia.**
- **Crie a pasta ferramentas/integracoes/ vazia.**

### Ao final, me mostre:

- A árvore final de pastas e arquivos criados
- Quais campos ficaram com > A definir para eu preencher depois

Faça as perguntas agora e aguarde minhas respostas antes de criar qualquer arquivo.