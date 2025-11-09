# Logo Meu Ponto

Logo vetorial (SVG) criado especialmente para o sistema **Meu Ponto**.

## 🎨 Conceito do Design

O logo representa um **relógio de ponto** estilizado, com elementos que transmitem:

- **Precisão**: Círculos concêntricos e marcas horárias bem definidas
- **Pontualidade**: Ponteiros posicionados em horário de início de expediente (9h)
- **Foco no "Ponto"**: Centro destacado com múltiplas camadas representando o registro
- **Movimento**: Arco inferior sugerindo dinamismo e fluxo contínuo

## 📐 Especificações Técnicas

- **Formato**: SVG (Scalable Vector Graphics)
- **Dimensões**: 200x200px (escalável sem perda de qualidade)
- **Cor principal**: `hsl(262.1 83.3% 57.8%)` - Roxo vibrante (primary color)
- **Elementos**:
  - Círculo externo: borda do relógio (r=90)
  - Círculo interno decorativo: detalhe sutil (r=75, opacity 0.3)
  - 12 marcas horárias: 4 principais + 8 secundárias
  - 2 ponteiros: horas (9h) e minutos (12h)
  - Centro em destaque: 3 círculos concêntricos com efeito de brilho

## 💡 Significado dos Elementos

### Ponteiros do Relógio
- **Ponteiro das horas**: Apontando para 9h (início típico do expediente)
- **Ponteiro dos minutos**: Apontando para 12h (hora exata)
- Juntos formam um ângulo de 90°, representando organização e estrutura

### Centro (Ponto)
O centro do relógio é o elemento mais destacado, representando:
- O "ponto" sendo registrado
- A precisão do sistema
- O foco principal da aplicação

### Arco Inferior
Linha tracejada sugerindo:
- Movimento contínuo do tempo
- Registros sendo processados
- Fluxo de trabalho dinâmico

## 🎯 Uso

O logo é usado:
1. **Página de Login**: Cabeçalho principal (128x128px)
2. **Favicon**: Versão otimizada para navegadores
3. **Documentação**: Identidade visual do projeto

## 🔧 Customização

Para alterar a cor do logo, modifique o valor HSL:

```svg
<!-- Cor atual (roxo) -->
stroke="hsl(262.1 83.3% 57.8%)"

<!-- Exemplos de outras cores -->
stroke="hsl(217 91% 60%)"  <!-- Azul -->
stroke="hsl(142 71% 45%)"  <!-- Verde -->
stroke="hsl(24 95% 53%)"   <!-- Laranja -->
```

## 📁 Localização

- **Desenvolvimento**: `/src/assets/logo.svg`
- **Produção**: `/public/logo.svg`
- **Componentes**: Importado via `logo.svg` (referência à pasta public)

## 🎨 Variações

Variações do logo disponíveis:
- [ ] Versão monocromática (branco/preto)
- [ ] Versão compacta (apenas centro)
- ✅ **Versão animada (CSS/SMIL)** → `logo-animated.svg`
- ✅ **Ícones para PWA (diferentes tamanhos)** → 6 tamanhos (16px a 512px)

---

**Criado para**: Sistema Meu Ponto
**Versão**: 1.0
**Data**: Novembro 2025
