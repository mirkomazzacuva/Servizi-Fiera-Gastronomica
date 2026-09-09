# Gestione Fiera

Web app per raccolta disponibilita, assegnazione ai padiglioni e conferma presenza via WhatsApp.

## Architettura
- GitHub Pages: ospita le pagine web.
- Supabase: database e login amministratore.
- WhatsApp normale: il pulsante Admin apre un messaggio precompilato con link personale di conferma.

## 1. Crea Supabase
1. Vai su https://supabase.com e crea un progetto gratuito.
2. Scegli una password database e attendi la creazione del progetto.
3. Apri `SQL Editor` > `New query`.
4. Copia tutto il contenuto di `supabase.sql` e premi `Run`.

## 2. Crea l'amministratore
1. Supabase > Authentication > Users.
2. `Add user` > `Create new user`.
3. Inserisci la tua email e una password forte.
4. Userai queste credenziali su `admin.html`.

## 3. Collega l'app a Supabase
1. Supabase > Project Settings > API (oppure Connect/API, a seconda dell'interfaccia).
2. Copia `Project URL` e la chiave pubblica `anon` / `publishable` compatibile con supabase-js.
3. Apri `config.js` e sostituisci:
   - `INCOLLA_QUI_SUPABASE_URL`
   - `INCOLLA_QUI_SUPABASE_ANON_KEY`
4. NON usare mai la `service_role` key nel repository.

## 4. Carica su GitHub
Nel repository `gestione-fiera`:
1. `Add file` > `Upload files`.
2. Trascina tutti i file di questa cartella (NON la cartella stessa):
   `index.html`, `admin.html`, `confirm.html`, `styles.css`, `config.js`, `app.js`, `admin.js`, `confirm.js`, `supabase.sql`, `README.md`.
3. Scrivi come commit: `Prima versione app Fiera`.
4. `Commit changes`.

## 5. Attiva GitHub Pages
1. Repository > `Settings` > `Pages`.
2. Source: `Deploy from a branch`.
3. Branch: `main`, cartella `/ (root)`.
4. `Save`.
5. Attendi circa 1-2 minuti. GitHub mostrera il link pubblico, tipicamente:
   `https://TUO-USERNAME.github.io/gestione-fiera/`

## 6. Link da usare
- Pubblico disponibilita: `https://TUO-USERNAME.github.io/gestione-fiera/`
- Admin: `https://TUO-USERNAME.github.io/gestione-fiera/admin.html`
- I link di conferma sono generati automaticamente dal pulsante WhatsApp.

## Sicurezza
Le tabelle Supabase hanno RLS attivo. Il pubblico non puo leggere persone, telefoni, disponibilita o assegnazioni. Le pagine pubbliche usano funzioni SQL dedicate. L'area admin richiede un utente Supabase autenticato.

## Dati 2026 gia inseriti
Il file SQL precarica le date 25/07-05/08/2026, tutti i padiglioni ricavati dal file operativo 2026 e i relativi riferimenti/responsabili, piu `La Baita`. Dall'area Admin puoi modificare le date per gli anni successivi e aggiornare i responsabili.
