# CRM de pacientes

Pacientes são cadastrados com nome e telefone; os demais dados aparecem por divulgação progressiva. A busca aceita nome ou telefone e pode ser filtrada pela jornada. Telefone repetido gera aviso, sem bloquear o atendimento.

A lista pode alternar para um funil somente de visualização, mantendo busca e filtros; não há drag-and-drop nem segundo fluxo de atualização. A ficha concentra resumo, alertas e timeline. Editar, registrar atendimento, agendar retorno e registrar venda/serviço abrem cartões modais nativos, preservando contexto sem nova aba e reduzindo a carga da tela.

Alterações usam `version`: se outra pessoa salvar antes, a API retorna 409 e evita sobrescrever trabalho. Pacientes são arquivados, nunca apagados. Eventos são append-only e o banco rejeita alteração ou exclusão.

Status: novo lead, triagem, avaliação marcada, em proposta, venda realizada, adaptação, acompanhamento e inativo.
