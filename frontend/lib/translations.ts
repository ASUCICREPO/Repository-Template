/**
 * Translation utilities for CincyMuse chatbot
 * Provides bilingual content (English/Spanish) for UI labels and messages
 */

import { Language } from '@/contexts/LanguageContext';

/**
 * Translation keys and their values in both languages
 */
const translations = {
  // Opening message
  openingMessage: {
    en: "Hi, I'm CincyMuse, your digital guide at Cincinnati Museum Center! Whether you're planning a visit, curious about exhibits, or need help with tickets and membership, I'm here to help. What can I assist you with today?",
    es: "¡Hola! Soy CincyMuse, tu guía digital en el Cincinnati Museum Center. Ya sea que estés planeando una visita, tengas curiosidad sobre las exhibiciones o necesites ayuda con boletos y membresías, estoy aquí para ayudarte. ¿En qué puedo asistirte hoy?",
  },

  // Low confidence fallback message
  fallbackMessage: {
    en: "You've asked a great question, but it's one I don't have the details for just yet. For the most accurate information, please contact our team at (513) 287-7000.",
    es: "Has hecho una gran pregunta, pero es una para la que aún no tengo los detalles. Para obtener la información más precisa, comunícate con nuestro equipo al (513) 287-7000.",
  },

  // UI Labels - Chat Interface
  languageSelector: {
    en: 'Language',
    es: 'Idioma',
  },
  english: {
    en: 'English',
    es: 'Inglés',
  },
  spanish: {
    en: 'Spanish',
    es: 'Español',
  },
  messagePlaceholder: {
    en: 'Type your question here...',
    es: 'Escribe tu pregunta aquí...',
  },
  sendButton: {
    en: 'Send',
    es: 'Enviar',
  },
  thinking: {
    en: 'Thinking...',
    es: 'Pensando...',
  },
  sources: {
    en: 'Sources',
    es: 'Fuentes',
  },
  confidence: {
    en: 'Confidence',
    es: 'Confianza',
  },
  feedbackPrompt: {
    en: 'Was this helpful?',
    es: '¿Fue esto útil?',
  },
  feedbackThanks: {
    en: 'Thank you for your feedback!',
    es: '¡Gracias por tu comentario!',
  },

  // Error messages
  errorGeneric: {
    en: 'Something went wrong. Please try again.',
    es: 'Algo salió mal. Por favor, inténtalo de nuevo.',
  },
  errorNetwork: {
    en: 'Network error. Please check your connection.',
    es: 'Error de red. Por favor, verifica tu conexión.',
  },
  errorMessageTooLong: {
    en: 'Message must be 1000 characters or less.',
    es: 'El mensaje debe tener 1000 caracteres o menos.',
  },
  errorMessageEmpty: {
    en: 'Please enter a message.',
    es: 'Por favor, ingresa un mensaje.',
  },

  // UI Labels - Admin Dashboard
  adminDashboard: {
    en: 'Admin Dashboard',
    es: 'Panel de Administración',
  },
  login: {
    en: 'Login',
    es: 'Iniciar Sesión',
  },
  logout: {
    en: 'Logout',
    es: 'Cerrar Sesión',
  },
  email: {
    en: 'Email',
    es: 'Correo Electrónico',
  },
  password: {
    en: 'Password',
    es: 'Contraseña',
  },
  conversationLogs: {
    en: 'Conversation Logs',
    es: 'Registros de Conversaciones',
  },
  pdfManagement: {
    en: 'PDF Management',
    es: 'Gestión de PDFs',
  },
  faqAnalytics: {
    en: 'FAQ Analytics',
    es: 'Análisis de Preguntas Frecuentes',
  },
  systemHealth: {
    en: 'System Health',
    es: 'Estado del Sistema',
  },
  uploadPDF: {
    en: 'Upload PDF',
    es: 'Subir PDF',
  },
  deletePDF: {
    en: 'Delete',
    es: 'Eliminar',
  },
  download: {
    en: 'Download',
    es: 'Descargar',
  },
  export: {
    en: 'Export',
    es: 'Exportar',
  },
  filter: {
    en: 'Filter',
    es: 'Filtrar',
  },
  search: {
    en: 'Search',
    es: 'Buscar',
  },
  dateRange: {
    en: 'Date Range',
    es: 'Rango de Fechas',
  },
  startDate: {
    en: 'Start Date',
    es: 'Fecha de Inicio',
  },
  endDate: {
    en: 'End Date',
    es: 'Fecha de Fin',
  },
  question: {
    en: 'Question',
    es: 'Pregunta',
  },
  response: {
    en: 'Response',
    es: 'Respuesta',
  },
  timestamp: {
    en: 'Timestamp',
    es: 'Marca de Tiempo',
  },
  feedback: {
    en: 'Feedback',
    es: 'Comentarios',
  },
  positive: {
    en: 'Positive',
    es: 'Positivo',
  },
  negative: {
    en: 'Negative',
    es: 'Negativo',
  },
  filename: {
    en: 'Filename',
    es: 'Nombre de Archivo',
  },
  uploadDate: {
    en: 'Upload Date',
    es: 'Fecha de Carga',
  },
  fileSize: {
    en: 'File Size',
    es: 'Tamaño de Archivo',
  },
  status: {
    en: 'Status',
    es: 'Estado',
  },
  processing: {
    en: 'Processing',
    es: 'Procesando',
  },
  indexed: {
    en: 'Indexed',
    es: 'Indexado',
  },
  error: {
    en: 'Error',
    es: 'Error',
  },
  count: {
    en: 'Count',
    es: 'Cantidad',
  },
  avgConfidence: {
    en: 'Avg Confidence',
    es: 'Confianza Promedio',
  },
  category: {
    en: 'Category',
    es: 'Categoría',
  },
  avgResponseTime: {
    en: 'Avg Response Time',
    es: 'Tiempo de Respuesta Promedio',
  },
  errorRate: {
    en: 'Error Rate',
    es: 'Tasa de Error',
  },
  totalRequests: {
    en: 'Total Requests',
    es: 'Solicitudes Totales',
  },
  viewerNote: {
    en: 'You have read-only access.',
    es: 'Tienes acceso de solo lectura.',
  },
  adminOnly: {
    en: 'Admin only',
    es: 'Solo administradores',
  },
} as const;

export type TranslationKey = keyof typeof translations;

/**
 * Get translated text for a given key and language
 * 
 * @param key - Translation key
 * @param language - Language code ('en' or 'es')
 * @returns Translated text
 */
export function t(key: TranslationKey, language: Language): string {
  return translations[key][language];
}

/**
 * Get opening message in the specified language
 */
export function getOpeningMessage(language: Language): string {
  return t('openingMessage', language);
}

/**
 * Get fallback message in the specified language
 */
export function getFallbackMessage(language: Language): string {
  return t('fallbackMessage', language);
}

/**
 * Hook to get translation function bound to current language
 */
export function useTranslation(language: Language) {
  return {
    t: (key: TranslationKey) => t(key, language),
    openingMessage: getOpeningMessage(language),
    fallbackMessage: getFallbackMessage(language),
  };
}
