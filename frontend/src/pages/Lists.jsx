import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import listsApi from "../api/listsApi";
import ListGrid from "../components/lists/ListGrid";
import ListFormModal from "../components/lists/ListFormModal";

const Lists = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState("public"); // "public" | "mine"
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [showFormModal, setShowFormModal] = useState(false);

  useEffect(() => {
    fetchLists();
  }, [tab, search, sort]);

  const fetchLists = async () => {
    try {
      setLoading(true);
      setError("");
      const data =
        tab === "mine"
          ? await listsApi.getMyLists()
          : await listsApi.getLists({ search: search || undefined, sort });
      setLists(data.lists || []);
    } catch (err) {
      setError(err.response?.data?.message || "Klarte ikke laste lister");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8 animate-fadeIn">
          <div>
            <h1 className="text-5xl font-bold gradient-text mb-3">📋 Lister</h1>
            <p className="text-gray-700 text-lg">
              {lists.length} {lists.length === 1 ? "liste" : "lister"}
            </p>
          </div>

          <button onClick={() => setShowFormModal(true)} className="btn-accent">
            ✨ Ny liste
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab("public")}
            className="px-4 py-2 rounded-full text-sm font-semibold transition-all"
            style={
              tab === "public"
                ? { background: "var(--color-primary)", color: "white", border: "1.5px solid var(--color-primary)" }
                : { background: "white", color: "#6B5B95", border: "1.5px solid #6B5B95" }
            }
          >
            🌍 Offentlige lister
          </button>
          <button
            onClick={() => setTab("mine")}
            className="px-4 py-2 rounded-full text-sm font-semibold transition-all"
            style={
              tab === "mine"
                ? { background: "var(--color-primary)", color: "white", border: "1.5px solid var(--color-primary)" }
                : { background: "white", color: "#6B5B95", border: "1.5px solid #6B5B95" }
            }
          >
            👤 Mine lister
          </button>
        </div>

        {tab === "public" && (
          <div className="container-gradient mb-8">
            <div className="grid md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-2">🔍 Søk etter lister</label>
                <input
                  type="text"
                  placeholder="Søk etter tittel..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">🔄 Sorter etter</label>
                <select value={sort} onChange={(e) => setSort(e.target.value)} className="input-field">
                  <option value="newest">Nyeste først</option>
                  <option value="oldest">Eldste først</option>
                  <option value="title">Tittel A-Z</option>
                </select>
              </div>
            </div>
          </div>
        )}

        <ListGrid lists={lists} loading={loading} error={error} />
      </div>

      {showFormModal && (
        <ListFormModal
          onClose={() => setShowFormModal(false)}
          onSaved={(list) => navigate(`/lists/${list._id}`)}
        />
      )}
    </div>
  );
};

export default Lists;
