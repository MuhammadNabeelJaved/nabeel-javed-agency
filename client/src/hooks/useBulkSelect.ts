/**
 * useBulkSelect — generic multi-select hook for list pages.
 *
 * Works with any array of items that have `_id` or `id` fields.
 * Usage:
 *   const bulk = useBulkSelect(items);
 *   <input type="checkbox" checked={bulk.isSelected(item._id)} onChange={() => bulk.toggle(item._id)} />
 *   <BulkActionBar count={bulk.count} onClear={bulk.clear} ... />
 */
import { useState, useCallback } from 'react';

type Identifiable = { _id?: string; id?: string | number };

export function useBulkSelect<T extends Identifiable>(items: T[]) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const getId = (item: T): string => String(item._id ?? item.id ?? '');

  const toggle = useCallback((id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelected(prev =>
      prev.size === items.length
        ? new Set()
        : new Set(items.map(getId))
    );
  }, [items]);

  const clear = useCallback(() => setSelected(new Set()), []);

  const isSelected = (id: string) => selected.has(id);
  const allSelected  = items.length > 0 && selected.size === items.length;
  const someSelected = selected.size > 0 && selected.size < items.length;

  return {
    selected,
    toggle,
    toggleAll,
    clear,
    isSelected,
    allSelected,
    someSelected,
    count: selected.size,
    ids: Array.from(selected),
  };
}
