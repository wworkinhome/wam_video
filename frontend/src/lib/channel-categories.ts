// Categorías sugeridas para canales de TV en vivo. No son un enum cerrado en el
// backend (Channel.category es texto libre) — son solo las opciones que se
// sugieren en el admin y los filtros de /canales.
export const CHANNEL_CATEGORIES = ['Deportes', 'Noticias', 'Música', 'Kids', 'Entretenimiento'] as const;
