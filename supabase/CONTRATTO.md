# Cosa `index.html` chiede al database

Ricavato leggendo il client, non la dashboard. Serve a due cose: verificare che
l'export dello schema sia completo, e accorgersi quando il client comincia a
usare qualcosa che nel database non c'è (o smette di usare qualcosa che c'è).

## RPC chiamate dal client

| Funzione | Argomenti | Dove |
|---|---|---|
| `ensure_actor` | `p_display_name` | avvio, dopo login Google |
| `preview_invite` | `p_token` | apertura link `?t=` (**anche da anonimo**) |
| `join_plan` | `p_token`, `p_display_name`, `p_claim_actor` | primo voto da ospite |
| `submit_ballot` | `p_plan`, `p_field`, `p_candidates`, `p_none_ok`, `p_note` | invio voto |
| `create_plan` | `p` (oggetto) | creazione |
| `add_candidates` | `p_plan`, `p_field`, `p_items` | organizzatore aggiunge opzioni |
| `confirm_plan` | `p_plan`, `p_when`, `p_where` | conferma |
| `update_plan_field` | `p_plan`, `p_field`, `p_value`, `p_note` | modifica data/posto |
| `cancel_plan` | `p_plan`, `p_note` | annullamento |
| `set_rsvp` | `p_plan`, `p_rsvp` | ci sto / forse / non vengo |
| `set_my_email` | `p_email` | dopo il voto |
| `log_event` | `p_name`, `p_plan`, `p_props` | funnel |

**Presenti nel database ma mai chiamate dal client:**
`remove_participant`, `revoke_invite_links`, `create_invite_link`.

Le prime due sono un problema di prodotto, non di codice morto: oggi un link
`?t=` che finisce nel gruppo sbagliato **non si può revocare** e chi è entrato
**non si può togliere**. Le funzioni ci sono già; manca solo il bottone.

## Letture dirette (dipendono dalle policy RLS)

| Tabella / vista | Colonne lette |
|---|---|
| `actors` | `id`, `display_name` |
| `plans` | `*` · e `id, title, status, starts_at, all_day, place_name, organizer_id, created_at` |
| `candidates` | `*` |
| `participants` | `actor_id, role, rsvp, actors(display_name)` · `plan_id, role, rsvp` |
| `ballots` | `actor_id, field, none_ok, note, actors(display_name)` |
| `approvals` | `candidate_id, actor_id` |
| `plan_changes` | `version, kind, new_value, note, created_at` |
| `v_candidate_results` | `candidate_id, field, approvals` |

Due note su queste letture:

- `participants` e `ballots` fanno join su `actors(display_name)`: la policy su
  `actors` deve permettere di leggere il nome di chi condivide un piano con te,
  altrimenti la vista organizzatore mostra `?` al posto dei nomi.
- la query su `approvals` filtra solo per `candidate_id`, senza `plan_id`:
  si affida **interamente** a RLS per non far vedere le preferenze altrui.
  Se quella policy si allenta, il voto smette di essere segreto senza che il
  client se ne accorga.

`v_missing_voters` esiste ma il client non la usa: calcola i mancanti in locale
(`renderOrg`).

## Tabelle mai lette direttamente

`invite_links` (token hashati sha256), `invite_uses`, `funnel_events`.
Si toccano solo attraverso le RPC — che è come deve essere.
