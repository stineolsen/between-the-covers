import { useState, useEffect } from "react";
import { useToast } from "../../contexts/ToastContext";
import commentsApi from "../../api/commentsApi";
import CommentCard from "./CommentCard";

const CommentThread = ({ listId, bookId }) => {
  const toast = useToast();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    setLoading(true);
    commentsApi
      .getComments({ listId, bookId })
      .then((data) => setComments(data.comments || []))
      .catch(() => toast.error("Klarte ikke laste kommentarer"))
      .finally(() => setLoading(false));
  }, [listId, bookId]);

  const handlePost = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setPosting(true);
    try {
      const data = await commentsApi.createComment({ listId, bookId, content });
      setComments((prev) => [...prev, data.comment]);
      setContent("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Klarte ikke legge til kommentar");
    } finally {
      setPosting(false);
    }
  };

  const handleEdit = async (commentId, newContent) => {
    try {
      const data = await commentsApi.updateComment(commentId, newContent);
      setComments((prev) => prev.map((c) => (c._id === commentId ? data.comment : c)));
    } catch (err) {
      toast.error(err.response?.data?.message || "Klarte ikke oppdatere kommentaren");
    }
  };

  const handleDelete = async (commentId) => {
    try {
      await commentsApi.deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
    } catch (err) {
      toast.error(err.response?.data?.message || "Klarte ikke slette kommentaren");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <div className="w-7 h-7 border-4 border-purple-300 border-t-purple-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {comments.length === 0 ? (
        <p className="text-sm text-gray-500 py-2">Ingen kommentarer ennå. Bli den første!</p>
      ) : (
        comments.map((comment) => (
          <CommentCard key={comment._id} comment={comment} onEdit={handleEdit} onDelete={handleDelete} />
        ))
      )}

      <form onSubmit={handlePost} className="flex gap-2 pt-2">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={2000}
          placeholder="Skriv en kommentar..."
          className="input-field flex-1 text-sm"
        />
        <button
          type="submit"
          disabled={posting || !content.trim()}
          className="px-4 py-2 rounded-xl text-white text-sm font-bold transition-all disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #7c3aed, #db2777)" }}
        >
          {posting ? "..." : "Send"}
        </button>
      </form>
    </div>
  );
};

export default CommentThread;
