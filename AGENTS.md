<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Regras de Negócio e Diretrizes de Design do Projeto Cinco Patas

- **Identidade da Marca**: "Cinco Patas Dog Car & Walker" (nome curto: "Cinco Patas").
- **Logo e Favicon**: `assets/logo.png` (Selo 3D metálico dourado com pata de cachorro e fundo transparente alpha) e `assets/favicon.png`.
- **Ícones**: Estilo dourado premium (`text-amber-400`, `text-gold`, `bg-gold-gradient`).
- **Navegação Mobile**: Menu hambúrguer (`☰`) com gaveta expansível para dispositivos móveis.
- **Calculadora de Táxi Dog**: Detalhamento de custos alinhado à esquerda.
- **Simulador de Passeio (Dog Walker)**: O combustível até o cliente fica embutido no valor do passeio e não deve ser exibido como item separado.
- **Combos & Mensais**:
  - Exibir apenas as cidades cadastradas em `settings.cities_covered`.
  - Incluir seleção de Porte do Pet (Pequeno, Médio, Grande, Gigante).
  - Formatação exata: `Combo Especial · {Bairro}` / `Assinatura · {Bairro}`, checklist com busca Táxi Dog 5km inclusos, 1h Dog Walker, parque à escolha até 5km, devolução em casa, desconto e nota de consulta para parques acima de 5km.
- **Cartão de Visita**: Frente cartoon em proporção exata de 85 x 55 mm com as 5 cachorras reais (Labrador Amarelo, Pitbull B&W, Peluda Dourada, Pinscher e Filhote) + Carro Nissan Livina bronze + Selo dourado 3D + Dados do Thiago.
- **Links Voltar ao Topo**: Botão "↑ Voltar ao topo" presente em todas as seções direcionadas pelo menu.
- **Galeria Sobre**: Exibir as 6 fotos dos pets (`thiago-1.jpg` a `thiago-6.jpg`) no formato de 2 colunas × 3 linhas (`grid-cols-2`).
- **Sem Botão Flutuante**: O botão flutuante do WhatsApp no canto inferior direito foi removido.
- **Compatibilidade Estática**: Manter os scripts como código estático sem `type="module"` para evitar erros de CORS via protocolo `file://`.
