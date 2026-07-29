---
name: cincopatas-project-rules
description: Regras de negócio e especificações de design do projeto Cinco Patas Dog Car & Walker
---

# Regras Globais do Projeto Cinco Patas Dog Car & Walker

## 1. Marca & Identidade Visual
- **Nome da Marca**: "Cinco Patas Dog Car & Walker" (nome curto: "Cinco Patas").
- **Logo Oficial**: Utilizar `assets/logo.png` (Selo metálico 3D dourado com pata de cachorro em PNG com transparência alpha).
- **Favicon**: `assets/favicon.png`.
- **Estilo de Ícones**: Estilo dourado premium (`text-amber-400`, `text-gold`, `bg-gold-gradient`).
- **Navegação Mobile**: Menu hambúrguer (`☰`) com gaveta expansível para dispositivos móveis.

## 2. Calculadora de Táxi Dog
- **Regra de Cálculo**:
  - Fórmula de Combustível: `distBairro * fuel_cost_per_km`
  - Taxa do Trajeto: `distTrajeto * ((perKm + petFuelRate) * multiplicadorPorte)`
  - Total: `Max(min_price + fuel, fuel + trajeto)`
- **Exibição**: O detalhamento de custos ("Combustível até você" e "Trajeto Pet + Humano") deve ser alinhado à esquerda no orçamento.

## 3. Simulador de Passeio (Dog Walker)
- **Regra de Cálculo**:
  - O valor do combustível até o cliente deve ficar **embutido no valor final do passeio**.
  - O detalhamento separado de combustível **NÃO deve ser exibido** para o cliente no simulador de passeio.

## 4. Combos & Mensais
- **Seleção de Cidade e Bairro**:
  - Apenas as cidades cadastradas em `settings.cities_covered` devem aparecer no menu de cidades.
- **Seleção de Porte**: Radio cards iguais aos das calculadoras (Pequeno, Médio, Grande, Gigante).
- **Formatação de Texto Obrigatória**:
  - Combo Aventurinha:
    - Tag: `Combo Especial · {Bairro}`
    - Título: `Combo Aventurinha`
    - Subtítulo: `Calculado para {Bairro} · Porte {PorteLabel}`
    - Preço: `R$ {valor} / por aventura`
    - Itens:
      - `✓ Busca com Táxi Dog (até 5 km inclusos) partindo de {Bairro}`
      - `✓ 1h de passeio Dog Walker para porte {PorteLabel}`
      - `✓ Parque a sua escolha (com limite de 5km de distância)`
      - `✓ Devolução em casa com segurança`
      - `✓ 15% de desconto sobre o valor cheio ({valor_sem_desconto})`
      - `* Para um parque acima de 5km será necessário consulta`
  - Combo VIP Mensal:
    - Tag: `Assinatura · {Bairro}`
    - Título: `Combo VIP Mensal`
    - Subtítulo: `Calculado para {Bairro} · Porte {PorteLabel}`
    - Preço: `R$ {valor} / por mês`
    - Itens:
      - `✓ Todos os benefícios do Combo Aventurinha`
      - `✓ 4 aventurinha mensais`
      - `✓ 25% de desconto mensal ({valor_sem_desconto} sem desconto)`
      - `* Para um parque acima de 5km será necessário consulta`

## 5. Cartão de Visita
- **Arte Gráfica Cartoon**: Proporção exata de **85 × 55 mm** (1700 × 1100 px), exibindo as 5 cachorras reais (Labrador Amarelo, Pitbull B&W, Peluda Dourada, Pinscher e Filhote) + Carro Nissan Livina bronze + Selo dourado 3D + Dados do Thiago.

## 6. Navegação & Rodapé
- **Links de Navegação**: Toda seção direcionada pelo menu (`#calculadora`, `#simulador-passeio`, `#planos`, `#sobre`, `#faq`) deve conter o botão "↑ Voltar ao topo" apontando para `#top`.
- **Galeria Sobre**: Exibir as 6 fotos dos pets (`thiago-1.jpg` a `thiago-6.jpg`) no formato de 2 colunas × 3 linhas (`grid-cols-2`).
- **Sem Botão Flutuante**: O botão flutuante do WhatsApp no canto inferior direito foi removido.
- **Arquivos Estáticos**: Manter a aplicação estática e autônoma na pasta `src/` usando scripts clássicos sem `type="module"` para evitar erros de CORS ao abrir via `file://`.
