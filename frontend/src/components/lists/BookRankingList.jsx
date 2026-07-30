import { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { useToast } from "../../contexts/ToastContext";
import listsApi from "../../api/listsApi";
import BookRankingRow from "./BookRankingRow";

const BookRankingList = ({ listId, books, canEdit, onBooksChange }) => {
  const toast = useToast();
  const [items, setItems] = useState(books);

  useEffect(() => {
    setItems(books);
  }, [books]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((entry) => entry.book._id === active.id);
    const newIndex = items.findIndex((entry) => entry.book._id === over.id);
    const reordered = arrayMove(items, oldIndex, newIndex);

    const previous = items;
    setItems(reordered);

    try {
      const data = await listsApi.reorderBooks(
        listId,
        reordered.map((entry) => entry.book._id),
      );
      setItems(data.list.books);
      onBooksChange?.(data.list.books);
    } catch (err) {
      setItems(previous);
      toast.error(err.response?.data?.message || "Klarte ikke oppdatere rekkefølgen");
    }
  };

  const handleRemove = async (bookId) => {
    const previous = items;
    setItems((prev) => prev.filter((entry) => entry.book._id !== bookId));
    try {
      const data = await listsApi.removeBook(listId, bookId);
      onBooksChange?.(data.list.books);
    } catch (err) {
      setItems(previous);
      toast.error(err.response?.data?.message || "Klarte ikke fjerne boken");
    }
  };

  if (items.length === 0) {
    return (
      <div className="card text-center py-12">
        <div className="text-4xl mb-3">📚</div>
        <p className="text-gray-600 font-medium">Ingen bøker på listen ennå</p>
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((entry) => entry.book._id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {items.map((entry, index) => (
            <BookRankingRow
              key={entry.book._id}
              listId={listId}
              entry={entry}
              rank={index + 1}
              canEdit={canEdit}
              onRemove={handleRemove}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};

export default BookRankingList;
