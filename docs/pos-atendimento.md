# Pós-atendimento

Acompanhamento é a fila acionável do cuidado contínuo, sem criar um CRM paralelo. Mostra retornos de hoje, atrasados, próximos 30 dias, pacientes em adaptação e pacientes sem contato há 90 dias.

Retornos novos exigem um Médico ativo e são agendados na ficha; podem ser concluídos ou cancelados sem apagar histórico. A próxima ação do paciente é sempre derivada da tarefa aberta mais próxima. Datas de hoje e atraso usam `America/Sao_Paulo`.

Tarefas históricas criadas antes desta regra permanecem sem médico e não são reescritas. A migration aplica a obrigatoriedade somente a novos vínculos para não atribuir retroativamente um profissional sem evidência.
# Pós-venda automático

Cada venda confirmada exige um Médico responsável porque agenda contatos em D+7, D+30 e D+90 a partir da data civil da venda. O cancelamento encerra apenas as tarefas abertas ligadas à venda, preservando todo o histórico.
