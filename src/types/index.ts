export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: string;
  end: string;
  location?: string;
  colorId?: string;
  calendarId: string;
  type: 'event';
}

export interface Task {
  id: string;
  title: string;
  notes?: string;
  due?: string;
  status: 'needsAction' | 'completed';
  taskListId: string;
  type: 'task';
}

export type BoardItem = CalendarEvent | Task;

export interface Column {
  id: string;
  name: string;
  position: number;
  color: string;
  user_id: string;
}

export interface CardCategory {
  id: string;
  user_id: string;
  item_id: string;
  item_type: 'event' | 'task';
  column_id: string;
}

export interface BoardState {
  columns: Column[];
  items: BoardItem[];
  cardCategories: Map<string, string>; // item_id -> column_id
}

// Labels/Tags system
export interface Label {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface ItemLabel {
  id: string;
  item_id: string;
  label_id: string;
}

// Filter types
export type FilterType = 'all' | 'tasks' | 'events' | 'overdue';

// Undo action types
export interface UndoAction {
  id: string;
  type: 'move' | 'trash' | 'complete' | 'delete';
  description: string;
  timestamp: number;
  undo: () => Promise<void>;
}
