import { create } from 'zustand';

export interface DocumentInfo {
  id: string;
  title: string;
  type: string;
  lang: string;
  status: string;
  entities: number;
  confidence: string;
  date: string;
}

interface DocumentState {
  documents: DocumentInfo[];
  addDocument: (doc: DocumentInfo) => void;
}

const MOCK_DOCUMENTS: DocumentInfo[] = [];

export const useDocumentStore = create<DocumentState>((set) => ({
  documents: MOCK_DOCUMENTS,
  addDocument: (doc) => set((state) => ({ documents: [doc, ...state.documents] }))
}));
