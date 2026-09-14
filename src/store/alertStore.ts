import { create } from 'zustand';
import { readPreferences, writePreferences } from './localStorageProvider';
import type { AlertFilters, SavedPreferences, SortConfig } from '../lib/types';

interface AlertStore extends SavedPreferences {
  selectedAlertId: string | null;
  filterDraftRevision: number;
  setSearchQuery: (searchQuery: string | undefined) => void;
  commitApiFilters: (
    filters: Omit<AlertFilters, 'searchQuery'>,
    revision: number,
  ) => void;
  setActiveFilters: (filters: AlertFilters) => void;
  clearFilters: () => void;
  setSortConfig: (sort: SortConfig) => void;
  setSelectedAlertId: (id: string | null) => void;
}

export const useAlertStore = create<AlertStore>(set => ({
  // Restore before mounting the page so the first request uses saved filters.
  ...readPreferences(),
  selectedAlertId: null,
  filterDraftRevision: 0,
  setSearchQuery: searchQuery =>
    set(state => ({
      activeFilters: { ...state.activeFilters, searchQuery },
      selectedAlertId: null,
    })),
  commitApiFilters: (filters, revision) =>
    set(state =>
      revision === state.filterDraftRevision
        ? {
            activeFilters: {
              ...filters,
              searchQuery: state.activeFilters.searchQuery,
            },
            selectedAlertId: null,
          }
        : state,
    ),
  setActiveFilters: activeFilters =>
    set(state => ({
      activeFilters,
      selectedAlertId: null,
      filterDraftRevision: state.filterDraftRevision + 1,
    })),
  clearFilters: () =>
    set(state => ({
      activeFilters: {},
      selectedAlertId: null,
      filterDraftRevision: state.filterDraftRevision + 1,
    })),
  setSortConfig: sortConfig => set({ sortConfig }),
  setSelectedAlertId: selectedAlertId => set({ selectedAlertId }),
}));

useAlertStore.subscribe((state, previous) => {
  const preferencesChanged =
    state.activeFilters !== previous.activeFilters ||
    state.sortConfig !== previous.sortConfig;

  if (!preferencesChanged) {
    return;
  }

  writePreferences({
    activeFilters: state.activeFilters,
    sortConfig: state.sortConfig,
  });
});
