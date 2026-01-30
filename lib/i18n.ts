/**
 * Internationalization (i18n) support for VOXERA
 * Supports multiple UI languages
 */

export type SupportedLanguage = 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'ru'

export interface Translations {
  // Common
  appName: string
  tagline: string
  press: string
  toActivate: string
  orSay: string
  toRecord: string
  
  // Recording
  startRecording: string
  stopRecording: string
  recording: string
  
  // Status
  idle: string
  transcribing: string
  enriching: string
  complete: string
  
  // Actions
  edit: string
  save: string
  cancel: string
  copy: string
  copied: string
  download: string
  read: string
  stop: string
  translate: string
  translating: string
  
  // Labels
  voice: string
  speed: string
  pitch: string
  translateTo: string
  enrichedOutput: string
  transcript: string
  
  // Messages
  clickToStart: string
  hotkeyRegistered: string
  hotkeyFailed: string
  noVoicesAvailable: string
  loadingVoices: string
  enterYourName: string
  
  // Help
  howItWorks: string
  gettingStarted: string
  gettingStartedDesc: string
  waysToRecord: string
  activateWindow: string
  activateWindowDesc: string
  wakeWordDesc: string
  recordButton: string
  recordButtonDesc: string
  workflow: string
  workflowStep1: string
  workflowStep2: string
  workflowStep3: string
  workflowStep4: string
  workflowStep5: string
  features: string
  feature1: string
  feature2: string
  feature3: string
  feature4: string
  feature5: string
  feature6: string
  
  // Statistics
  usageStatistics: string
  currentRequest: string
  sessionTotals: string
  breakdownByType: string
  transcription: string
  enrichment: string
  translation: string
  totalTokens: string
  totalCost: string
  requests: string
  resetStatistics: string
}

const translations: Record<SupportedLanguage, Translations> = {
  en: {
    appName: 'VOXERA',
    tagline: 'Voice capture and AI enrichment',
        press: 'Press',
        toActivate: 'to activate window',
        orSay: 'or say',
        toRecord: 'to start recording',
    startRecording: 'Start Recording',
    stopRecording: 'Stop Recording',
    recording: 'Recording',
    idle: 'Idle',
    transcribing: 'Transcribing',
    enriching: 'Enriching',
    complete: 'Complete',
    edit: 'Edit',
    save: 'Save',
    cancel: 'Cancel',
    copy: 'Copy',
    copied: 'Copied!',
    download: 'Download',
    read: 'Read',
    stop: 'Stop',
    translate: 'Translate',
    translating: 'Translating...',
    voice: 'Voice',
    speed: 'Speed',
    pitch: 'Pitch',
    translateTo: 'Translate to',
    enrichedOutput: 'Enriched Output',
    transcript: 'Transcript',
    clickToStart: 'Click the button or use the hotkey to start recording',
    hotkeyRegistered: 'Hotkey registered',
    hotkeyFailed: 'Hotkey registration failed',
    noVoicesAvailable: 'No voices available',
    loadingVoices: 'Loading voices...',
    enterYourName: 'Enter your name',
    usageStatistics: 'Usage Statistics',
    currentRequest: 'Current Request',
    sessionTotals: 'Session Totals',
    breakdownByType: 'Breakdown by Type',
    transcription: 'Transcription',
    enrichment: 'Enrichment',
    translation: 'Translation',
    totalTokens: 'Total Tokens',
    totalCost: 'Total Cost',
    requests: 'Requests',
    resetStatistics: 'Reset Statistics',
    howItWorks: 'How Voxera Works',
    gettingStarted: 'Getting Started',
    gettingStartedDesc: 'Voxera is a voice capture and AI enrichment tool. Simply speak your thoughts, and Voxera will transcribe, enrich, and format them into structured output.',
    waysToRecord: 'Ways to Record',
    activateWindow: 'Activate Window',
    activateWindowDesc: 'Press the hotkey to show and focus the Voxera window. This doesn\'t start recording, just brings the app to the front.',
    wakeWordDesc: 'Say "Hey Voxera" to automatically start recording. The wake word detector listens continuously when not recording.',
    recordButton: 'Record Button',
    recordButtonDesc: 'Click the large record button in the center to manually start or stop recording.',
    workflow: 'Workflow',
    workflowStep1: 'Start recording using wake word, button, or hotkey',
    workflowStep2: 'Speak your thoughts, notes, or ideas',
    workflowStep3: 'Stop recording when finished',
    workflowStep4: 'Voxera automatically transcribes your audio',
    workflowStep5: 'AI enriches and formats the transcript based on detected mode (meeting, journal, task, etc.)',
    features: 'Key Features',
    feature1: 'Automatic mode detection (meeting, journal, task, planning, etc.)',
    feature2: 'Multi-language support for transcription and output',
    feature3: 'Text-to-speech with voice selection and controls',
    feature4: 'Translation to multiple languages',
    feature5: 'Edit and download your enriched output',
    feature6: 'Token usage and cost tracking',
  },
  es: {
    appName: 'VOXERA',
    tagline: 'Captura de voz y enriquecimiento con IA',
    press: 'Presiona',
    toActivate: 'para activar',
    orSay: 'o di',
    toRecord: 'para comenzar a grabar',
    startRecording: 'Iniciar Grabación',
    stopRecording: 'Detener Grabación',
    recording: 'Grabando',
    idle: 'Inactivo',
    transcribing: 'Transcribiendo',
    enriching: 'Enriqueciendo',
    complete: 'Completo',
    edit: 'Editar',
    save: 'Guardar',
    cancel: 'Cancelar',
    copy: 'Copiar',
    copied: '¡Copiado!',
    download: 'Descargar',
    read: 'Leer',
    stop: 'Detener',
    translate: 'Traducir',
    translating: 'Traduciendo...',
    voice: 'Voz',
    speed: 'Velocidad',
    pitch: 'Tono',
    translateTo: 'Traducir a',
    enrichedOutput: 'Salida Enriquecida',
    transcript: 'Transcripción',
    clickToStart: 'Haz clic en el botón o usa el atajo para comenzar a grabar',
    hotkeyRegistered: 'Atajo registrado',
    hotkeyFailed: 'Error al registrar el atajo',
    noVoicesAvailable: 'No hay voces disponibles',
    loadingVoices: 'Cargando voces...',
    enterYourName: 'Ingrese su nombre',
    usageStatistics: 'Estadísticas de Uso',
    currentRequest: 'Solicitud Actual',
    sessionTotals: 'Totales de Sesión',
    breakdownByType: 'Desglose por Tipo',
    transcription: 'Transcripción',
    enrichment: 'Enriquecimiento',
    translation: 'Traducción',
    totalTokens: 'Tokens Totales',
    totalCost: 'Costo Total',
    requests: 'Solicitudes',
    resetStatistics: 'Restablecer Estadísticas',
    howItWorks: 'Cómo Funciona Voxera',
    gettingStarted: 'Primeros Pasos',
    gettingStartedDesc: 'Voxera es una herramienta de captura de voz y enriquecimiento con IA. Simplemente habla tus pensamientos y Voxera los transcribirá, enriquecerá y formateará en una salida estructurada.',
    waysToRecord: 'Formas de Grabar',
    activateWindow: 'Activar Ventana',
    activateWindowDesc: 'Presiona el atajo para mostrar y enfocar la ventana de Voxera. Esto no inicia la grabación, solo trae la aplicación al frente.',
    wakeWordDesc: 'Di "Hey Voxera" para iniciar automáticamente la grabación. El detector de palabra de activación escucha continuamente cuando no se está grabando.',
    recordButton: 'Botón de Grabar',
    recordButtonDesc: 'Haz clic en el botón de grabar grande en el centro para iniciar o detener manualmente la grabación.',
    workflow: 'Flujo de Trabajo',
    workflowStep1: 'Inicia la grabación usando la palabra de activación, botón o atajo',
    workflowStep2: 'Habla tus pensamientos, notas o ideas',
    workflowStep3: 'Detén la grabación cuando termines',
    workflowStep4: 'Voxera transcribe automáticamente tu audio',
    workflowStep5: 'La IA enriquece y formatea la transcripción según el modo detectado (reunión, diario, tarea, etc.)',
    features: 'Características Principales',
    feature1: 'Detección automática de modo (reunión, diario, tarea, planificación, etc.)',
    feature2: 'Soporte multiidioma para transcripción y salida',
    feature3: 'Texto a voz con selección de voz y controles',
    feature4: 'Traducción a múltiples idiomas',
    feature5: 'Editar y descargar tu salida enriquecida',
    feature6: 'Seguimiento de uso de tokens y costos',
  },
  fr: {
    appName: 'VOXERA',
    tagline: 'Capture vocale et enrichissement IA',
    press: 'Appuyez sur',
    toActivate: 'pour activer la fenêtre',
    orSay: 'ou dites',
    toRecord: 'pour démarrer l\'enregistrement',
    startRecording: 'Démarrer l\'enregistrement',
    stopRecording: 'Arrêter l\'enregistrement',
    recording: 'Enregistrement',
    idle: 'Inactif',
    transcribing: 'Transcription',
    enriching: 'Enrichissement',
    complete: 'Terminé',
    edit: 'Modifier',
    save: 'Enregistrer',
    cancel: 'Annuler',
    copy: 'Copier',
    copied: 'Copié!',
    download: 'Télécharger',
    read: 'Lire',
    stop: 'Arrêter',
    translate: 'Traduire',
    translating: 'Traduction...',
    voice: 'Voix',
    speed: 'Vitesse',
    pitch: 'Hauteur',
    translateTo: 'Traduire en',
    enrichedOutput: 'Sortie Enrichie',
    transcript: 'Transcription',
    clickToStart: 'Cliquez sur le bouton ou utilisez le raccourci pour commencer l\'enregistrement',
    hotkeyRegistered: 'Raccourci enregistré',
    hotkeyFailed: 'Échec de l\'enregistrement du raccourci',
    noVoicesAvailable: 'Aucune voix disponible',
    loadingVoices: 'Chargement des voix...',
    enterYourName: 'Entrez votre nom',
    usageStatistics: 'Statistiques d\'Utilisation',
    currentRequest: 'Requête Actuelle',
    sessionTotals: 'Totaux de Session',
    breakdownByType: 'Répartition par Type',
    transcription: 'Transcription',
    enrichment: 'Enrichissement',
    translation: 'Traduction',
    totalTokens: 'Tokens Totaux',
    totalCost: 'Coût Total',
    requests: 'Requêtes',
    resetStatistics: 'Réinitialiser les Statistiques',
    howItWorks: 'Comment Fonctionne Voxera',
    gettingStarted: 'Pour Commencer',
    gettingStartedDesc: 'Voxera est un outil de capture vocale et d\'enrichissement IA. Parlez simplement vos pensées, et Voxera les transcrira, enrichira et formatera en sortie structurée.',
    waysToRecord: 'Moyens d\'Enregistrer',
    activateWindow: 'Activer la Fenêtre',
    activateWindowDesc: 'Appuyez sur le raccourci pour afficher et mettre au premier plan la fenêtre Voxera. Cela ne démarre pas l\'enregistrement, mais amène simplement l\'application au premier plan.',
    wakeWordDesc: 'Dites "Hey Voxera" pour démarrer automatiquement l\'enregistrement. Le détecteur de mot d\'activation écoute en continu lorsqu\'il n\'y a pas d\'enregistrement.',
    recordButton: 'Bouton d\'Enregistrement',
    recordButtonDesc: 'Cliquez sur le grand bouton d\'enregistrement au centre pour démarrer ou arrêter manuellement l\'enregistrement.',
    workflow: 'Flux de Travail',
    workflowStep1: 'Démarrez l\'enregistrement en utilisant le mot d\'activation, le bouton ou le raccourci',
    workflowStep2: 'Parlez vos pensées, notes ou idées',
    workflowStep3: 'Arrêtez l\'enregistrement lorsque vous avez terminé',
    workflowStep4: 'Voxera transcrit automatiquement votre audio',
    workflowStep5: 'L\'IA enrichit et formate la transcription selon le mode détecté (réunion, journal, tâche, etc.)',
    features: 'Caractéristiques Principales',
    feature1: 'Détection automatique de mode (réunion, journal, tâche, planification, etc.)',
    feature2: 'Support multilingue pour la transcription et la sortie',
    feature3: 'Synthèse vocale avec sélection de voix et contrôles',
    feature4: 'Traduction vers plusieurs langues',
    feature5: 'Modifier et télécharger votre sortie enrichie',
    feature6: 'Suivi de l\'utilisation des tokens et des coûts',
  },
  de: {
    appName: 'VOXERA',
    tagline: 'Spracherfassung und KI-Anreicherung',
    press: 'Drücken Sie',
    toActivate: 'zum Aktivieren des Fensters',
    orSay: 'oder sagen Sie',
    toRecord: 'um die Aufnahme zu starten',
    startRecording: 'Aufnahme starten',
    stopRecording: 'Aufnahme stoppen',
    recording: 'Aufnahme',
    idle: 'Leerlauf',
    transcribing: 'Transkribieren',
    enriching: 'Anreichern',
    complete: 'Abgeschlossen',
    edit: 'Bearbeiten',
    save: 'Speichern',
    cancel: 'Abbrechen',
    copy: 'Kopieren',
    copied: 'Kopiert!',
    download: 'Herunterladen',
    read: 'Lesen',
    stop: 'Stoppen',
    translate: 'Übersetzen',
    translating: 'Übersetzen...',
    voice: 'Stimme',
    speed: 'Geschwindigkeit',
    pitch: 'Tonhöhe',
    translateTo: 'Übersetzen nach',
    enrichedOutput: 'Angereicherte Ausgabe',
    transcript: 'Transkript',
    clickToStart: 'Klicken Sie auf die Schaltfläche oder verwenden Sie die Tastenkombination, um die Aufnahme zu starten',
    hotkeyRegistered: 'Tastenkombination registriert',
    hotkeyFailed: 'Registrierung der Tastenkombination fehlgeschlagen',
    noVoicesAvailable: 'Keine Stimmen verfügbar',
    loadingVoices: 'Stimmen werden geladen...',
    enterYourName: 'Geben Sie Ihren Namen ein',
    usageStatistics: 'Nutzungsstatistiken',
    currentRequest: 'Aktuelle Anforderung',
    sessionTotals: 'Sitzungssummen',
    breakdownByType: 'Aufschlüsselung nach Typ',
    transcription: 'Transkription',
    enrichment: 'Anreicherung',
    translation: 'Übersetzung',
    totalTokens: 'Gesamte Tokens',
    totalCost: 'Gesamtkosten',
    requests: 'Anfragen',
    resetStatistics: 'Statistiken zurücksetzen',
    howItWorks: 'Wie Voxera funktioniert',
    gettingStarted: 'Erste Schritte',
    gettingStartedDesc: 'Voxera ist ein Tool zur Spracherfassung und KI-Anreicherung. Sprechen Sie einfach Ihre Gedanken aus, und Voxera wird sie transkribieren, anreichern und in strukturierte Ausgabe formatieren.',
    waysToRecord: 'Aufnahmemöglichkeiten',
    activateWindow: 'Fenster aktivieren',
    activateWindowDesc: 'Drücken Sie die Tastenkombination, um das Voxera-Fenster anzuzeigen und in den Vordergrund zu bringen. Dies startet keine Aufnahme, sondern bringt nur die App in den Vordergrund.',
    wakeWordDesc: 'Sagen Sie "Hey Voxera", um die Aufnahme automatisch zu starten. Der Wake-Word-Detektor hört kontinuierlich, wenn keine Aufnahme läuft.',
    recordButton: 'Aufnahmetaste',
    recordButtonDesc: 'Klicken Sie auf die große Aufnahmetaste in der Mitte, um die Aufnahme manuell zu starten oder zu stoppen.',
    workflow: 'Arbeitsablauf',
    workflowStep1: 'Starten Sie die Aufnahme mit Wake-Word, Taste oder Tastenkombination',
    workflowStep2: 'Sprechen Sie Ihre Gedanken, Notizen oder Ideen',
    workflowStep3: 'Stoppen Sie die Aufnahme, wenn Sie fertig sind',
    workflowStep4: 'Voxera transkribiert Ihr Audio automatisch',
    workflowStep5: 'Die KI reichert die Transkription an und formatiert sie basierend auf dem erkannten Modus (Meeting, Journal, Aufgabe usw.)',
    features: 'Hauptfunktionen',
    feature1: 'Automatische Moduserkennung (Meeting, Journal, Aufgabe, Planung usw.)',
    feature2: 'Mehrsprachige Unterstützung für Transkription und Ausgabe',
    feature3: 'Text-zu-Sprache mit Sprachauswahl und Steuerung',
    feature4: 'Übersetzung in mehrere Sprachen',
    feature5: 'Bearbeiten und Herunterladen Ihrer angereicherten Ausgabe',
    feature6: 'Token-Verbrauch und Kostenverfolgung',
  },
  it: {
    appName: 'VOXERA',
    tagline: 'Cattura vocale e arricchimento IA',
    press: 'Premere',
    toActivate: 'per attivare la finestra',
    orSay: 'o dici',
    toRecord: 'per iniziare la registrazione',
    startRecording: 'Inizia Registrazione',
    stopRecording: 'Ferma Registrazione',
    recording: 'Registrazione',
    idle: 'Inattivo',
    transcribing: 'Trascrizione',
    enriching: 'Arricchimento',
    complete: 'Completo',
    edit: 'Modifica',
    save: 'Salva',
    cancel: 'Annulla',
    copy: 'Copia',
    copied: 'Copiato!',
    download: 'Scarica',
    read: 'Leggi',
    stop: 'Ferma',
    translate: 'Traduci',
    translating: 'Traduzione...',
    voice: 'Voce',
    speed: 'Velocità',
    pitch: 'Tono',
    translateTo: 'Traduci in',
    enrichedOutput: 'Output Arricchito',
    transcript: 'Trascrizione',
    clickToStart: 'Clicca il pulsante o usa il tasto di scelta rapida per iniziare la registrazione',
    hotkeyRegistered: 'Tasto di scelta rapida registrato',
    hotkeyFailed: 'Registrazione tasto di scelta rapida fallita',
    noVoicesAvailable: 'Nessuna voce disponibile',
    loadingVoices: 'Caricamento voci...',
    enterYourName: 'Inserisci il tuo nome',
    usageStatistics: 'Statistiche di Utilizzo',
    currentRequest: 'Richiesta Corrente',
    sessionTotals: 'Totali Sessione',
    breakdownByType: 'Ripartizione per Tipo',
    transcription: 'Trascrizione',
    enrichment: 'Arricchimento',
    translation: 'Traduzione',
    totalTokens: 'Token Totali',
    totalCost: 'Costo Totale',
    requests: 'Richieste',
    resetStatistics: 'Reimposta Statistiche',
    howItWorks: 'Come Funziona Voxera',
    gettingStarted: 'Per Iniziare',
    gettingStartedDesc: 'Voxera è uno strumento di cattura vocale e arricchimento IA. Parla semplicemente i tuoi pensieri e Voxera li trascriverà, arricchirà e formatterà in output strutturato.',
    waysToRecord: 'Modi per Registrare',
    activateWindow: 'Attiva Finestra',
    activateWindowDesc: 'Premi la scorciatoia per mostrare e mettere a fuoco la finestra Voxera. Questo non avvia la registrazione, ma porta semplicemente l\'app in primo piano.',
    wakeWordDesc: 'Dì "Hey Voxera" per avviare automaticamente la registrazione. Il rilevatore di parola di attivazione ascolta continuamente quando non si sta registrando.',
    recordButton: 'Pulsante Registrazione',
    recordButtonDesc: 'Clicca sul grande pulsante di registrazione al centro per avviare o fermare manualmente la registrazione.',
    workflow: 'Flusso di Lavoro',
    workflowStep1: 'Avvia la registrazione usando la parola di attivazione, il pulsante o la scorciatoia',
    workflowStep2: 'Parla i tuoi pensieri, note o idee',
    workflowStep3: 'Ferma la registrazione quando hai finito',
    workflowStep4: 'Voxera trascrive automaticamente il tuo audio',
    workflowStep5: 'L\'IA arricchisce e formatta la trascrizione in base alla modalità rilevata (riunione, diario, attività, ecc.)',
    features: 'Caratteristiche Principali',
    feature1: 'Rilevamento automatico della modalità (riunione, diario, attività, pianificazione, ecc.)',
    feature2: 'Supporto multilingua per trascrizione e output',
    feature3: 'Sintesi vocale con selezione della voce e controlli',
    feature4: 'Traduzione in più lingue',
    feature5: 'Modifica e scarica il tuo output arricchito',
    feature6: 'Monitoraggio dell\'utilizzo dei token e dei costi',
  },
  pt: {
    appName: 'VOXERA',
    tagline: 'Captura de voz e enriquecimento com IA',
    press: 'Pressione',
    toActivate: 'para ativar a janela',
    orSay: 'ou diga',
    toRecord: 'para começar a gravar',
    startRecording: 'Iniciar Gravação',
    stopRecording: 'Parar Gravação',
    recording: 'Gravando',
    idle: 'Inativo',
    transcribing: 'Transcrevendo',
    enriching: 'Enriquecendo',
    complete: 'Completo',
    edit: 'Editar',
    save: 'Salvar',
    cancel: 'Cancelar',
    copy: 'Copiar',
    copied: 'Copiado!',
    download: 'Baixar',
    read: 'Ler',
    stop: 'Parar',
    translate: 'Traduzir',
    translating: 'Traduzindo...',
    voice: 'Voz',
    speed: 'Velocidade',
    pitch: 'Tom',
    translateTo: 'Traduzir para',
    enrichedOutput: 'Saída Enriquecida',
    transcript: 'Transcrição',
    clickToStart: 'Clique no botão ou use o atalho para começar a gravar',
    hotkeyRegistered: 'Atalho registrado',
    hotkeyFailed: 'Falha ao registrar atalho',
    noVoicesAvailable: 'Nenhuma voz disponível',
    loadingVoices: 'Carregando vozes...',
    enterYourName: 'Digite seu nome',
    usageStatistics: 'Estatísticas de Uso',
    currentRequest: 'Solicitação Atual',
    sessionTotals: 'Totais da Sessão',
    breakdownByType: 'Divisão por Tipo',
    transcription: 'Transcrição',
    enrichment: 'Enriquecimento',
    translation: 'Tradução',
    totalTokens: 'Tokens Totais',
    totalCost: 'Custo Total',
    requests: 'Solicitações',
    resetStatistics: 'Redefinir Estatísticas',
    howItWorks: 'Como o Voxera Funciona',
    gettingStarted: 'Para Começar',
    gettingStartedDesc: 'Voxera é uma ferramenta de captura de voz e enriquecimento com IA. Simplesmente fale seus pensamentos e o Voxera os transcreverá, enriquecerá e formatará em saída estruturada.',
    waysToRecord: 'Formas de Gravar',
    activateWindow: 'Ativar Janela',
    activateWindowDesc: 'Pressione o atalho para mostrar e focar a janela do Voxera. Isso não inicia a gravação, apenas traz o aplicativo para a frente.',
    wakeWordDesc: 'Diga "Hey Voxera" para iniciar automaticamente a gravação. O detector de palavra de ativação ouve continuamente quando não está gravando.',
    recordButton: 'Botão de Gravar',
    recordButtonDesc: 'Clique no grande botão de gravar no centro para iniciar ou parar manualmente a gravação.',
    workflow: 'Fluxo de Trabalho',
    workflowStep1: 'Inicie a gravação usando a palavra de ativação, botão ou atalho',
    workflowStep2: 'Fale seus pensamentos, notas ou ideias',
    workflowStep3: 'Pare a gravação quando terminar',
    workflowStep4: 'Voxera transcreve automaticamente seu áudio',
    workflowStep5: 'A IA enriquece e formata a transcrição com base no modo detectado (reunião, diário, tarefa, etc.)',
    features: 'Recursos Principais',
    feature1: 'Detecção automática de modo (reunião, diário, tarefa, planejamento, etc.)',
    feature2: 'Suporte multilíngue para transcrição e saída',
    feature3: 'Texto para fala com seleção de voz e controles',
    feature4: 'Tradução para vários idiomas',
    feature5: 'Editar e baixar sua saída enriquecida',
    feature6: 'Rastreamento de uso de tokens e custos',
  },
  ru: {
    appName: 'VOXERA',
    tagline: 'Захват голоса и обогащение ИИ',
    press: 'Нажмите',
    toActivate: 'для активации окна',
    orSay: 'или скажите',
    toRecord: 'чтобы начать запись',
    startRecording: 'Начать запись',
    stopRecording: 'Остановить запись',
    recording: 'Запись',
    idle: 'Ожидание',
    transcribing: 'Транскрибирование',
    enriching: 'Обогащение',
    complete: 'Завершено',
    edit: 'Редактировать',
    save: 'Сохранить',
    cancel: 'Отмена',
    copy: 'Копировать',
    copied: 'Скопировано!',
    download: 'Скачать',
    read: 'Читать',
    stop: 'Остановить',
    translate: 'Перевести',
    translating: 'Перевод...',
    voice: 'Голос',
    speed: 'Скорость',
    pitch: 'Тон',
    translateTo: 'Перевести на',
    enrichedOutput: 'Обогащенный вывод',
    transcript: 'Транскрипт',
    clickToStart: 'Нажмите кнопку или используйте горячую клавишу для начала записи',
    hotkeyRegistered: 'Горячая клавиша зарегистрирована',
    hotkeyFailed: 'Не удалось зарегистрировать горячую клавишу',
    noVoicesAvailable: 'Нет доступных голосов',
    loadingVoices: 'Загрузка голосов...',
    enterYourName: 'Введите ваше имя',
    usageStatistics: 'Статистика использования',
    currentRequest: 'Текущий запрос',
    sessionTotals: 'Итоги сессии',
    breakdownByType: 'Разбивка по типу',
    transcription: 'Транскрипция',
    enrichment: 'Обогащение',
    translation: 'Перевод',
    totalTokens: 'Всего токенов',
    totalCost: 'Общая стоимость',
    requests: 'Запросы',
    resetStatistics: 'Сбросить статистику',
    howItWorks: 'Как Работает Voxera',
    gettingStarted: 'Начало Работы',
    gettingStartedDesc: 'Voxera - это инструмент для захвата голоса и обогащения с помощью ИИ. Просто говорите свои мысли, и Voxera расшифрует, обогатит и отформатирует их в структурированный вывод.',
    waysToRecord: 'Способы Записи',
    activateWindow: 'Активировать Окно',
    activateWindowDesc: 'Нажмите горячую клавишу, чтобы показать и сфокусировать окно Voxera. Это не запускает запись, а просто выводит приложение на передний план.',
    wakeWordDesc: 'Скажите "Hey Voxera", чтобы автоматически начать запись. Детектор слова пробуждения слушает непрерывно, когда запись не ведется.',
    recordButton: 'Кнопка Записи',
    recordButtonDesc: 'Нажмите большую кнопку записи в центре, чтобы вручную начать или остановить запись.',
    workflow: 'Рабочий Процесс',
    workflowStep1: 'Начните запись, используя слово пробуждения, кнопку или горячую клавишу',
    workflowStep2: 'Говорите свои мысли, заметки или идеи',
    workflowStep3: 'Остановите запись, когда закончите',
    workflowStep4: 'Voxera автоматически расшифрует ваш аудио',
    workflowStep5: 'ИИ обогащает и форматирует расшифровку на основе обнаруженного режима (встреча, дневник, задача и т.д.)',
    features: 'Ключевые Функции',
    feature1: 'Автоматическое определение режима (встреча, дневник, задача, планирование и т.д.)',
    feature2: 'Многоязычная поддержка для расшифровки и вывода',
    feature3: 'Преобразование текста в речь с выбором голоса и управлением',
    feature4: 'Перевод на несколько языков',
    feature5: 'Редактирование и загрузка вашего обогащенного вывода',
    feature6: 'Отслеживание использования токенов и затрат',
  },
}


let currentLanguage: SupportedLanguage = 'en'

export function setLanguage(lang: SupportedLanguage) {
  currentLanguage = lang
  if (typeof window !== 'undefined') {
    localStorage.setItem('voxera-ui-language', lang)
  }
}

export function getLanguage(): SupportedLanguage {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('voxera-ui-language')
    if (saved && saved in translations) {
      return saved as SupportedLanguage
    }
  }
  // Auto-detect from browser
  if (typeof window !== 'undefined') {
    const browserLang = navigator.language.split('-')[0] as SupportedLanguage
    if (browserLang in translations) {
      return browserLang
    }
  }
  return 'en'
}

export function t(key: keyof Translations): string {
  const lang = getLanguage()
  return translations[lang]?.[key] || translations.en[key] || key
}

// Initialize language on load
if (typeof window !== 'undefined') {
  currentLanguage = getLanguage()
}

