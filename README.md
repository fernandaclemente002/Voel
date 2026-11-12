
  # VÖEL (cópia)

  This is a code bundle for VÖEL (cópia). The original project is available at https://www.figma.com/design/04TZro2qSSAAcZsPDwoIXm/V%C3%96EL--c%C3%B3pia-.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

## Parcelamento por produto

O painel permite habilitar o parcelamento em até 2x ou 3x e informar uma taxa
total para cada opção, com até duas casas decimais. Taxa zero significa sem
juros. `max_installments = 1` desabilita a oferta, preservando as taxas salvas.
Os produtos antigos recebem taxas de 0%; nenhum percentual de operadora é
presumido. O preço cadastrado é o preço à vista.

O cálculo compartilhado pelo painel, vitrine e WhatsApp usa:

`total = preço à vista × quantidade × (1 + taxa total / 100)`

O total é arredondado uma única vez para centavos (meio centavo para cima).
O cálculo percentual usa inteiros, sem juros mensais ou compostos. O total em
centavos é dividido entre as parcelas, distribuindo os centavos restantes nas
primeiras parcelas. R$ 150,00 a 5% em 3x resulta em R$ 157,50, ou 3x de R$ 52,50.
R$ 100,00 a 0% em 3x resulta em 1x de R$ 33,34 + 2x de R$ 33,33.
A taxa incide no subtotal dos produtos; frete é confirmado no atendimento.

Os cards exibem apenas o preço à vista e uma linha como `ou 3x de R$ 52,50`,
com a taxa cadastrada já incluída no valor. No detalhe do produto, as opções
aparecem somente ao escolher Parcelado: a seleção mostra o valor das parcelas,
seguida do total. A taxa e eventuais ajustes de centavos ficam em Ver condições.
Quando as parcelas diferem por centavos, o resumo usa `de até` com o maior
valor; a distribuição exata continua disponível nas condições. Taxa zero não
gera acréscimo, mas os cards não exibem o rótulo sem juros.

### Migração e publicação

Em bancos existentes, aplique `supabase/add-product-installment-rates.sql`
depois das migrações anteriores (incluindo `add-product-details.sql`) e antes
de publicar o frontend atualizado. Em instalações novas, execute também
`schema.sql` e os demais scripts `add-*.sql` existentes.

A migração adiciona `installment_rate_2` e `installment_rate_3` com padrão zero,
restringe o máximo a 1–3 e valida taxas não negativas, finitas e com até duas
casas decimais. Configurações antigas acima de 3x são reduzidas para 3x;
revise esses produtos antes da publicação e mantenha um backup para reversão.
As taxas e os totais também respeitam o limite de inteiros exatos do JavaScript.
Nenhuma política de acesso é alterada: as escritas continuam dependendo de
`public.is_admin()` nas políticas RLS existentes.

O frontend novo depende das novas colunas. Sem a migração, as consultas de
produtos falham; não há substituição silenciosa das taxas por zero. Prepare a
migração e a publicação em conjunto. O script pode ser executado novamente sem
sobrescrever taxas já cadastradas.

### Pagamento e verificação

Este projeto gera uma mensagem para o WhatsApp, sem integrar um gateway ou
efetuar cobranças. A mensagem informa taxa, parcelas e total já acrescido.
A loja deve conferir o total final no link da operadora para evitar aplicação
duplicada de juros. O orçamento da vitrine não configura a operadora.

Execute `npm run build` para verificar o bundle de produção. Na homologação,
verifique criação/edição e recarga, parcelamento desabilitado, 0%, taxas
diferentes em 2x/3x, quantidade, centavos, mobile/desktop e rejeição de escrita
por usuário anônimo ou autenticado sem acesso administrativo. Não há suíte de
testes automatizados configurada no projeto.
