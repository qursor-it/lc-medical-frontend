/**
 * Istruzioni "Come risolvere" per gli errori di import che l'utente può sistemare da solo.
 * La chiave è l'`errorCode` restituito dal backend (UploadRejectedException). I testi possono
 * contenere <strong> e <kbd>, resi con [innerHTML].
 */
export interface UploadErrorHelp {
  title: string;
  intro?: string;
  steps: string[];
  note?: string;
}

const KEY = (key: string) => `<kbd>${key}</kbd>`;

export const uploadErrorHelp: Record<string, UploadErrorHelp> = {
  XLSX_SENSITIVITY_LABEL: {
    title: 'File protetto da Microsoft (etichetta di riservatezza)',
    intro:
      "Il file è crittografato con la protezione Microsoft Purview: si apre solo nel tuo Excel, dopo l'accesso con il PIN o il codice ricevuto. Non c'è una password che il sistema possa usare, quindi va creata una copia non protetta.",
    steps: [
      'Apri il file in <strong>Excel sul computer</strong>, inserendo il PIN come fai di solito.',
      `Vai sul foglio con i dati, clicca sulla cella <strong>A1</strong> e premi ${KEY('Ctrl+A')} (${KEY('Cmd+A')} su Mac), poi copia con ${KEY('Ctrl+C')}.`,
      'Crea una nuova cartella di lavoro: <strong>File → Nuovo → Cartella di lavoro vuota</strong>.',
      'Clicca sulla cella <strong>A1</strong> e scegli <strong>Home → Incolla → Valori e formattazione numeri</strong> (mantiene le date senza portarsi dietro formule e protezione).',
      '<strong>File → Salva con nome</strong> come "Cartella di lavoro di Excel (.xlsx)" e carica qui il nuovo file.',
    ],
    note: 'Se Excel non ti permette di copiare, la protezione lo vieta: chiedi al mittente di inviarti il file senza etichetta di riservatezza crittografata.',
  },
  XLSX_PASSWORD_PROTECTED: {
    title: 'File protetto da password',
    steps: [
      'Apri il file in Excel inserendo la password.',
      'Vai su <strong>File → Informazioni → Proteggi cartella di lavoro → Crittografa con password</strong>.',
      'Cancella la password nel campo e premi <strong>OK</strong>.',
      'Salva il file e caricalo di nuovo qui.',
    ],
  },
  XLSX_WRONG_FORMAT: {
    title: 'Formato del file non supportato',
    intro:
      'Sono accettate solo le cartelle di lavoro Excel moderne (.xlsx). I file .xls, .csv o .ods vanno prima convertiti.',
    steps: [
      'Apri il file in Excel.',
      'Vai su <strong>File → Salva con nome</strong>.',
      'In "Tipo file" scegli <strong>Cartella di lavoro di Excel (*.xlsx)</strong> e salva.',
      'Carica qui il nuovo file .xlsx.',
    ],
    note: 'Non basta rinominare l\'estensione del file: va convertito con "Salva con nome".',
  },
  XLSX_INVALID: {
    title: 'File Excel non leggibile',
    intro:
      'Il file è danneggiato oppure non è davvero un Excel (per esempio un PDF o un CSV rinominato in .xlsx).',
    steps: [
      "Prova ad aprirlo in Excel: se non si apre, scaricalo di nuovo dall'email originale.",
      'Se si apre, usa <strong>File → Salva con nome → Cartella di lavoro di Excel (*.xlsx)</strong> e carica la copia.',
    ],
  },
  XLSX_UNEXPECTED_LAYOUT: {
    title: 'Struttura del file diversa da quella attesa',
    intro:
      'Il sistema legge il foglio <strong>Database_Unico</strong> (o, se manca, il primo foglio) e si aspetta le intestazioni delle colonne nella prima riga.',
    steps: [
      'Verifica di aver caricato il file delle commissioni Motiva e non un altro report.',
      'La prima riga deve contenere le intestazioni, tra cui <strong>Status</strong>, <strong>Web App Order</strong>, <strong>LineNum</strong>, <strong>ItemCode</strong> e <strong>Dscription</strong> (scritta proprio così).',
      'Se sono state aggiunte righe sopra le intestazioni, o colonne rinominate o eliminate, usa il file originale ricevuto da Motiva.',
    ],
    note: "Il messaggio d'errore indica la colonna o la parte mancante.",
  },
  PDF_INVALID: {
    title: 'PDF non leggibile',
    intro:
      'Il file è danneggiato oppure non è un PDF (per esempio una foto o un documento Word rinominato).',
    steps: [
      "Scarica di nuovo il PDF dall'email o dal portale da cui l'hai ricevuto.",
      'Verifica che si apra correttamente in un lettore PDF.',
      "Caricalo così com'è, senza modificarlo o rinominarlo.",
    ],
  },
  PDF_PASSWORD_PROTECTED: {
    title: 'PDF protetto da password',
    steps: [
      'Apri il PDF in <strong>Chrome</strong> o <strong>Edge</strong>, inserendo la password.',
      `Premi ${KEY('Ctrl+P')} (${KEY('Cmd+P')} su Mac) per stampare.`,
      'Come destinazione scegli <strong>Salva come PDF</strong> e salva il file.',
      'Carica qui il nuovo PDF, che non ha più la password.',
    ],
  },
  PDF_NO_TEXT: {
    title: 'PDF senza testo (scansione)',
    intro:
      'Il sistema legge il testo contenuto nel PDF. Questo file è solo un\'immagine: una scansione, una foto o una stampa "come immagine".',
    steps: [
      'Usa il PDF originale ricevuto da Motiva via email, non una sua scansione o ristampa.',
      "Per verificarlo, prova a selezionare il testo nel PDF: se non si seleziona, il file è un'immagine.",
    ],
    note: "Se hai solo la versione scansionata, chiedi a Motiva di inviarti di nuovo l'originale.",
  },
  PDF_NOT_AN_ORDER: {
    title: 'Il PDF non sembra un ordine Motiva',
    intro:
      "Nel documento non c'è il numero d'ordine (la voce <strong>ORDINE NO.</strong> o <strong>DDT NO.</strong>).",
    steps: [
      "Qui vanno caricate solo le conferme d'ordine e i DDT di Motiva: fatture o altri documenti non sono accettati.",
      'Controlla di aver selezionato il file giusto e che sia il PDF originale, non una scansione.',
    ],
  },
  PDF_NOT_AN_INVOICE: {
    title: 'Il PDF non sembra una fattura Motiva',
    intro:
      "Nel documento non c'è il numero d'ordine collegato (la voce <strong>Numero Ordine:</strong> della fattura di cortesia).",
    steps: [
      'Qui vanno caricate solo le fatture di cortesia di Motiva: ordini o altri documenti non sono accettati.',
      'Controlla di aver selezionato il file giusto e che sia il PDF originale, non una scansione.',
    ],
  },
};
