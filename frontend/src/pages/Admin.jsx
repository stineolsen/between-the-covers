import { useState, useEffect, useMemo } from "react";
import { authApi } from "../api/authApi";
import { productsApi } from "../api/productsApi";
import bookRequestApi from "../api/bookRequestApi";
import { usersApi } from "../api/usersApi";
import { booksApi } from "../api/booksApi";
import { importApi } from "../api/importApi";
import { notificationApi } from "../api/notificationApi";
import wrappedApi from "../api/wrappedApi";

const QUESTION_TYPE_LABELS = {
  text: "Fritekst",
  number: "Tall",
  "book-library": "Bok (bibliotek)",
  "book-bookclub": "Bok (bokklubb)",
};
import ProductForm from "../components/shop/ProductForm";
import AdminBookForm from "../components/admin/AdminBookForm";
import AddBookModal from "../components/books/AddBookModal";
import MatchAbsItemModal from "../components/books/MatchAbsItemModal";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const FORMAT_LABELS = { ebook: '📱 E-bok', audiobook: '🎧 Lydbok' };

const Admin = () => {
  const [activeTab, setActiveTab] = useState("requests");
  const [pendingUsers, setPendingUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [requests, setRequests] = useState([]);
  const [allMembers, setAllMembers] = useState([]);
  const [generatedPassword, setGeneratedPassword] = useState(null); // { username, password }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showArchive, setShowArchive] = useState(false);
  const [showBookForm, setShowBookForm] = useState(false);
  const [calibreImportSince, setCalibreImportSince] = useState(null);
  const [calibreSinceInput, setCalibreSinceInput] = useState("");
  const [runningCalibreImport, setRunningCalibreImport] = useState(false);
  const [calibreImportResult, setCalibreImportResult] = useState(null);
  const [runningAbsSync, setRunningAbsSync] = useState(false);
  const [absSyncResult, setAbsSyncResult] = useState(null);
  const [showUnmatchedAbs, setShowUnmatchedAbs] = useState(false);
  const [matchingAbsItem, setMatchingAbsItem] = useState(null);
  const [addingAbsItem, setAddingAbsItem] = useState(null);
  const [linkingNewBook, setLinkingNewBook] = useState(false);
  const [runningAbsListeningSync, setRunningAbsListeningSync] = useState(false);
  const [absListeningSyncResult, setAbsListeningSyncResult] = useState(null);
  const [absUsernameInputs, setAbsUsernameInputs] = useState({});
  const [savingAbsUsername, setSavingAbsUsername] = useState(null);
  const [alertSubject, setAlertSubject] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [sendingAlert, setSendingAlert] = useState(false);
  const [alertResult, setAlertResult] = useState(null);
  const [linkingRequestId, setLinkingRequestId] = useState(null);
  const [bookSearchQuery, setBookSearchQuery] = useState("");
  const [bookSearchResults, setBookSearchResults] = useState([]);
  const [searchingBooks, setSearchingBooks] = useState(false);
  const [selectedBookForLink, setSelectedBookForLink] = useState(null);
  const [now] = useState(() => Date.now());
  const [wrappedWindowStart, setWrappedWindowStart] = useState("");
  const [wrappedWindowEnd, setWrappedWindowEnd] = useState("");
  const [savingWrappedWindow, setSavingWrappedWindow] = useState(false);
  const [wrappedTally, setWrappedTally] = useState(null);
  const [wrappedQuestions, setWrappedQuestions] = useState([]);
  const [wrappedSubmittedCount, setWrappedSubmittedCount] = useState(0);
  const [wrappedTotalMembers, setWrappedTotalMembers] = useState(0);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [questionForm, setQuestionForm] = useState({ label: "", type: "text", helper: "" });
  const [savingQuestion, setSavingQuestion] = useState(false);
  const wrappedYear = new Date().getFullYear();

  const { visibleRequests, archivedRequestsCount } = useMemo(() => {
    const cutoff = now - 14 * 24 * 60 * 60 * 1000;
    const isArchived = (req) =>
      (req.status === 'added' || req.status === 'irrelevant' || req.status === 'dismissed') &&
      new Date(req.createdAt).getTime() < cutoff;
    return {
      visibleRequests: requests.filter(req => showArchive ? isArchived(req) : !isArchived(req)),
      archivedRequestsCount: requests.filter(isArchived).length,
    };
  }, [requests, showArchive, now]);

  const handleBookFormSuccess = () => {
    setShowBookForm(false);
    setSuccessMessage("Bok lagt til!");
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const fetchImportStatus = async () => {
    try {
      setLoading(true);
      const data = await importApi.getStatus();
      setCalibreImportSince(data.calibreImportSince);
      setCalibreSinceInput(data.calibreImportSince ? data.calibreImportSince.slice(0, 10) : "");
      setError("");
    } catch (err) {
      setError("Greide ikke laste importstatus");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCalibreSince = async () => {
    try {
      const since = calibreSinceInput ? new Date(calibreSinceInput).toISOString() : null;
      const data = await importApi.setCalibreSince(since);
      setCalibreImportSince(data.calibreImportSince);
      setSuccessMessage("Importdato lagret!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError("Greide ikke lagre importdato");
      console.error(err);
    }
  };

  const fetchWrappedAdmin = async () => {
    try {
      setLoading(true);
      const [windowData, tallyData] = await Promise.all([
        wrappedApi.getAdminWindow(wrappedYear),
        wrappedApi.getAdminTally(wrappedYear),
      ]);
      setWrappedWindowStart(windowData.start);
      setWrappedWindowEnd(windowData.end);
      setWrappedTally(tallyData.tally);
      setWrappedQuestions(tallyData.questions || []);
      setWrappedSubmittedCount(tallyData.submittedCount);
      setWrappedTotalMembers(tallyData.totalMembers);
      setError("");
    } catch (err) {
      setError("Greide ikke laste Bokwrapped-status");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveWrappedWindow = async () => {
    setSavingWrappedWindow(true);
    try {
      await wrappedApi.updateAdminWindow(wrappedYear, {
        start: wrappedWindowStart,
        end: wrappedWindowEnd,
      });
      setSuccessMessage("Innsamlingsvinduet er lagret!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError("Greide ikke lagre innsamlingsvinduet");
      console.error(err);
    } finally {
      setSavingWrappedWindow(false);
    }
  };

  const handleAddQuestion = () => {
    setEditingQuestion(null);
    setQuestionForm({ label: "", type: "text", helper: "" });
    setShowQuestionForm(true);
  };

  const handleEditQuestion = (question) => {
    setEditingQuestion(question);
    setQuestionForm({ label: question.label, type: question.type, helper: question.helper || "" });
    setShowQuestionForm(true);
  };

  const handleSaveQuestion = async () => {
    if (!questionForm.label.trim()) {
      setError("Spørsmålet må ha en tekst");
      return;
    }
    setSavingQuestion(true);
    try {
      if (editingQuestion) {
        await wrappedApi.updateQuestion(wrappedYear, editingQuestion._id, questionForm);
      } else {
        await wrappedApi.createQuestion(wrappedYear, questionForm);
      }
      setShowQuestionForm(false);
      setEditingQuestion(null);
      await fetchWrappedAdmin();
      setSuccessMessage("Spørsmål lagret!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Greide ikke lagre spørsmålet");
      console.error(err);
    } finally {
      setSavingQuestion(false);
    }
  };

  const handleDeleteQuestion = async (question) => {
    if (!window.confirm(`Er du sikker på at du vil slette spørsmålet «${question.label}»?`)) {
      return;
    }
    try {
      await wrappedApi.deleteQuestion(wrappedYear, question._id);
      await fetchWrappedAdmin();
      setSuccessMessage("Spørsmål slettet!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError("Greide ikke slette spørsmålet");
      console.error(err);
    }
  };

  const handleToggleQuestionActive = async (question) => {
    try {
      await wrappedApi.updateQuestion(wrappedYear, question._id, { active: !question.active });
      await fetchWrappedAdmin();
    } catch (err) {
      setError("Greide ikke oppdatere spørsmålet");
      console.error(err);
    }
  };

  const handleMoveQuestion = async (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= wrappedQuestions.length) return;
    const reordered = [...wrappedQuestions];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    setWrappedQuestions(reordered);
    try {
      await wrappedApi.reorderQuestions(wrappedYear, reordered.map((q) => q._id));
      await fetchWrappedAdmin();
    } catch (err) {
      setError("Greide ikke lagre rekkefølgen");
      console.error(err);
    }
  };

  const handleRunCalibreImport = async () => {
    setRunningCalibreImport(true);
    setCalibreImportResult(null);
    try {
      const data = await importApi.runCalibreImport();
      setCalibreImportResult(data);
      setCalibreImportSince(data.calibreImportSince);
      setCalibreSinceInput(data.calibreImportSince ? data.calibreImportSince.slice(0, 10) : "");
      setSuccessMessage("Bokimport fullført!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Bokimport feilet");
      console.error(err);
    } finally {
      setRunningCalibreImport(false);
    }
  };

  const handleRunAbsSync = async () => {
    setRunningAbsSync(true);
    setAbsSyncResult(null);
    setShowUnmatchedAbs(false);
    try {
      const data = await importApi.runAbsSync();
      setAbsSyncResult(data);
      setSuccessMessage("Lydboksynkronisering fullført!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Lydboksynkronisering feilet");
      console.error(err);
    } finally {
      setRunningAbsSync(false);
    }
  };

  const handleRunAbsListeningSync = async () => {
    setRunningAbsListeningSync(true);
    setAbsListeningSyncResult(null);
    try {
      const data = await importApi.runAbsListeningSync();
      setAbsListeningSyncResult(data);
      setSuccessMessage("Lyttestatistikk oppdatert!");
      setTimeout(() => setSuccessMessage(""), 3000);
      const membersData = await usersApi.getMembers();
      setAllMembers(membersData.members || []);
    } catch (err) {
      setError(err.response?.data?.message || "Klarte ikke oppdatere lyttestatistikk");
      console.error(err);
    } finally {
      setRunningAbsListeningSync(false);
    }
  };

  const handleSaveAbsUsername = async (memberId) => {
    setSavingAbsUsername(memberId);
    try {
      const value = absUsernameInputs[memberId] ?? "";
      const data = await usersApi.setAbsUsername(memberId, value);
      setAllMembers((prev) => prev.map((m) => (m._id === memberId ? data.user : m)));
      setSuccessMessage("Audiobookshelf-brukernavn lagret!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Klarte ikke lagre brukernavn");
      console.error(err);
    } finally {
      setSavingAbsUsername(null);
    }
  };

  // Removes a resolved (matched or newly-created-and-linked) item from the
  // unmatched list shown after an ABS sync, without needing to re-run it.
  const handleAbsItemResolved = (absId) => {
    setAbsSyncResult((prev) =>
      prev
        ? {
            ...prev,
            unmatched: Math.max(0, prev.unmatched - 1),
            unmatchedItems: prev.unmatchedItems.filter((i) => i.absId !== absId),
          }
        : prev,
    );
  };

  const handleNewBookCreated = async (book) => {
    if (!addingAbsItem) return;
    setLinkingNewBook(true);
    try {
      await importApi.matchAbsItem({
        bookId: book._id,
        absId: addingAbsItem.absId,
        audiobookUrl: addingAbsItem.audiobookUrl,
      });
      handleAbsItemResolved(addingAbsItem.absId);
      setSuccessMessage("Bok lagt til og koblet til lydboken!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Boken ble lagt til, men klarte ikke koble lydboklenken");
    } finally {
      setLinkingNewBook(false);
      setAddingAbsItem(null);
    }
  };

  const handleSendFeatureAlert = async () => {
    if (!alertSubject.trim() || !alertMessage.trim()) {
      setError("Tittel og melding er påkrevd");
      return;
    }
    setSendingAlert(true);
    setAlertResult(null);
    try {
      const data = await notificationApi.sendFeatureAlert(alertSubject.trim(), alertMessage.trim());
      setAlertResult(data);
      setAlertSubject("");
      setAlertMessage("");
      setSuccessMessage("Varsel sendt!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Klarte ikke sende varsel");
      console.error(err);
    } finally {
      setSendingAlert(false);
    }
  };

  const fetchAllMembers = async () => {
    try {
      setLoading(true);
      const data = await usersApi.getMembers();
      setAllMembers(data.members || []);
      setError("");
    } catch (err) {
      setError("Greide ikke laste brukere");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminResetPassword = async (userId, username) => {
    if (!window.confirm(`Tilbakestille passordet til ${username}?`)) return;
    try {
      const data = await authApi.adminResetPassword(userId);
      setGeneratedPassword({ username, password: data.generatedPassword });
    } catch (err) {
      setError("Greide ikke tilbakestille passord");
      console.error(err);
    }
  };

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const data = await bookRequestApi.getAll();
      setRequests(data.requests || []);
      setError("");
    } catch (err) {
      setError("Greide ikke laste forespørsler");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsAdded = async (id, book) => {
    try {
      await bookRequestApi.markAsAdded(id, book?._id);
      setRequests(prev => prev.map(r => r._id === id
        ? { ...r, status: 'added', addedAt: new Date().toISOString(), addedBook: book || null }
        : r));
      setLinkingRequestId(null);
      setBookSearchQuery("");
      setBookSearchResults([]);
      setSelectedBookForLink(null);
      setSuccessMessage("Markert som lagt til!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError("Greide ikke oppdatere forespørsel");
      console.error(err);
    }
  };

  const handleOpenLinkPicker = (req) => {
    setLinkingRequestId(req._id);
    setBookSearchQuery(req.title || "");
    setBookSearchResults([]);
    setSelectedBookForLink(null);
  };

  const handleCloseLinkPicker = () => {
    setLinkingRequestId(null);
    setBookSearchQuery("");
    setBookSearchResults([]);
    setSelectedBookForLink(null);
  };

  const handleSearchBooksForLink = async (query) => {
    setBookSearchQuery(query);
    setSelectedBookForLink(null);
    if (!query.trim()) {
      setBookSearchResults([]);
      return;
    }
    try {
      setSearchingBooks(true);
      const data = await booksApi.getBooks({ search: query.trim() });
      setBookSearchResults((data.books || []).slice(0, 6));
    } catch (err) {
      console.error(err);
    } finally {
      setSearchingBooks(false);
    }
  };

  const handleMarkAsIrrelevant = async (id) => {
    try {
      await bookRequestApi.markAsIrrelevant(id);
      setRequests(prev => prev.map(r => r._id === id ? { ...r, status: 'irrelevant' } : r));
      setSuccessMessage("Markert som ikke relevant!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError("Greide ikke oppdatere forespørsel");
      console.error(err);
    }
  };

  const fetchPendingUsers = async () => {
    try {
      setLoading(true);
      const data = await authApi.getPendingUsers();
      setPendingUsers(data.users);
      setError("");
    } catch (err) {
      setError("Greide ikke laste brukere til godkjenning");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveUser = async (userId, status) => {
    try {
      await authApi.approveUser(userId, status);
      setSuccessMessage(
        `Bruker ${status === "approved" ? "godkjent" : "avvist"}!`,
      );
      // Remove user from pending list
      setPendingUsers(pendingUsers.filter((user) => user._id !== userId));

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError(
        `Greide ikke ${status === "approved" ? "godkjenne" : "avvise"} bruker`,
      );
      console.error(err);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await productsApi.getProducts();
      setProducts(data.products || []);
      setError("");
    } catch (err) {
      setError("Greide ikke laste varer");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setShowProductForm(true);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setShowProductForm(true);
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm("Er du sikker på at du vil slette varen?")) {
      return;
    }

    try {
      await productsApi.deleteProduct(productId);
      setSuccessMessage("Vare slettet!");
      setProducts(products.filter((p) => p._id !== productId));
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError("Lykkes ikke med å slette varen");
      console.error(err);
    }
  };

  const handleProductFormSuccess = () => {
    setSuccessMessage(
      `Vare ${editingProduct ? "oppdatert" : "opprettet"} uten problemer!`,
    );
    setShowProductForm(false);
    setEditingProduct(null);
    fetchProducts();
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const handleProductFormCancel = () => {
    setShowProductForm(false);
    setEditingProduct(null);
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await productsApi.getOrders();
      setOrders(data.orders || []);
      setError("");
    } catch (err) {
      setError("Greide ikke laste bestillinger");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "users") {
      fetchPendingUsers();
    } else if (activeTab === "products") {
      fetchProducts();
    } else if (activeTab === "orders") {
      fetchOrders();
    } else if (activeTab === "requests") {
      fetchRequests();
    } else if (activeTab === "passwords") {
      fetchAllMembers();
    } else if (activeTab === "import") {
      fetchImportStatus();
    } else if (activeTab === "wrapped") {
      fetchWrappedAdmin();
    }
  }, [activeTab]);

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await productsApi.updateOrderStatus(orderId, newStatus);
      setSuccessMessage(`Bestillingsstatus oppdatert til ${newStatus}!`);
      fetchOrders();
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError("Greide ikke oppdatere bestillingsstatus");
      console.error(err);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "confirmed":
        return "bg-blue-100 text-blue-800";
      case "shipped":
        return "bg-purple-100 text-purple-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-sunken text-text";
    }
  };

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-5xl font-bold gradient-text mb-2">
            Admin Dashboard
          </h1>
          <p className="text-text-muted text-lg">
            Rediger brukere, varer, bestillinger og mer
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 flex-wrap">
          <button
            onClick={() => setActiveTab("requests")}
            className={`px-8 py-4 rounded-full font-bold transition-all transform hover:scale-105 shadow-lg ${
              activeTab === "requests" ? "text-white" : "bg-card text-text-muted"
            }`}
            style={
              activeTab === "requests"
                ? { background: "var(--color-primary-solid)" }
                : {}
            }
          >
            📋 Bokforespørsler
          </button>
          <button
            onClick={() => setActiveTab("products")}
            className={`px-8 py-4 rounded-full font-bold transition-all transform hover:scale-105 shadow-lg ${
              activeTab === "products" ? "text-white" : "bg-card text-text-muted"
            }`}
            style={
              activeTab === "products"
                ? { background: "var(--color-primary-solid)" }
                : {}
            }
          >
            🛍️ Varer
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={`px-8 py-4 rounded-full font-bold transition-all transform hover:scale-105 shadow-lg ${
              activeTab === "orders" ? "text-white" : "bg-card text-text-muted"
            }`}
            style={
              activeTab === "orders"
                ? { background: "var(--color-primary-solid)" }
                : {}
            }
          >
            📦 Bestillinger
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`px-8 py-4 rounded-full font-bold transition-all transform hover:scale-105 shadow-lg ${
              activeTab === "users" ? "text-white" : "bg-card text-text-muted"
            }`}
            style={
              activeTab === "users"
                ? { background: "var(--color-primary-solid)" }
                : {}
            }
          >
            👥 Brukere
          </button>
          <button
            onClick={() => setActiveTab("passwords")}
            className={`px-8 py-4 rounded-full font-bold transition-all transform hover:scale-105 shadow-lg ${
              activeTab === "passwords" ? "text-white" : "bg-card text-text-muted"
            }`}
            style={
              activeTab === "passwords"
                ? { background: "var(--color-primary-solid)" }
                : {}
            }
          >
            🔑 Tilbakestill passord
          </button>
          <button
            onClick={() => setActiveTab("books")}
            className={`px-8 py-4 rounded-full font-bold transition-all transform hover:scale-105 shadow-lg ${
              activeTab === "books" ? "text-white" : "bg-card text-text-muted"
            }`}
            style={
              activeTab === "books"
                ? { background: "var(--color-primary-solid)" }
                : {}
            }
          >
            📚 Legg til bok
          </button>
          <button
            onClick={() => setActiveTab("import")}
            className={`px-8 py-4 rounded-full font-bold transition-all transform hover:scale-105 shadow-lg ${
              activeTab === "import" ? "text-white" : "bg-card text-text-muted"
            }`}
            style={
              activeTab === "import"
                ? { background: "var(--color-primary-solid)" }
                : {}
            }
          >
            📥 Importer
          </button>
          <button
            onClick={() => setActiveTab("alerts")}
            className={`px-8 py-4 rounded-full font-bold transition-all transform hover:scale-105 shadow-lg ${
              activeTab === "alerts" ? "text-white" : "bg-card text-text-muted"
            }`}
            style={
              activeTab === "alerts"
                ? { background: "var(--color-primary-solid)" }
                : {}
            }
          >
            🔔 Send varsel
          </button>
          <button
            onClick={() => setActiveTab("wrapped")}
            className={`px-8 py-4 rounded-full font-bold transition-all transform hover:scale-105 shadow-lg ${
              activeTab === "wrapped" ? "text-white" : "bg-card text-text-muted"
            }`}
            style={
              activeTab === "wrapped"
                ? { background: "var(--color-primary-solid)" }
                : {}
            }
          >
            🎁 Bokwrapped
          </button>
        </div>

        {error && (
          <div
            className="mb-6 p-4 rounded-2xl text-white font-bold text-center animate-slideIn"
            style={{ background: "var(--color-terracotta-solid)" }}
          >
            {error}
          </div>
        )}

        {successMessage && (
          <div
            className="mb-6 p-4 rounded-2xl text-white font-bold text-center animate-slideIn"
            style={{ background: "var(--color-sage-solid)" }}
          >
            {successMessage}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <>
            {loading ? (
              <div className="container-gradient text-center py-12 animate-fadeIn">
                <div
                  className="animate-spin rounded-full h-12 w-12 mx-auto mb-4"
                  style={{
                    border: "4px solid rgba(255,255,255,0.3)",
                    borderTopColor: "var(--color-primary)",
                  }}
                ></div>
                <p className="text-text-muted font-bold">
                  Later brukere til godkjenning...
                </p>
              </div>
            ) : pendingUsers.length === 0 ? (
              <div className="container-gradient text-center py-12 animate-fadeIn">
                <p className="text-text-muted text-lg font-bold">
                  ✅ Ingen brukere til godkjenning for øyeblikket.
                </p>
              </div>
            ) : (
              <div className="grid gap-6 animate-fadeIn">
                {pendingUsers.map((user) => (
                  <div
                    key={user._id}
                    className="container-gradient hover:shadow-2xl transition-all transform hover:scale-[1.02]"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold gradient-text mb-1">
                          {user.displayName || user.username}
                        </h3>
                        <p className="text-text-muted mb-1 font-semibold">
                          @{user.username}
                        </p>
                        <p className="text-sm text-text-faint">{user.email}</p>
                        {user.bio && (
                          <p className="mt-2 text-text-muted italic">
                            {user.bio}
                          </p>
                        )}
                        <p className="mt-2 text-xs text-text-faint">
                          Registrert:{" "}
                          {new Date(user.joinedDate).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="flex gap-3 ml-6">
                        <button
                          onClick={() =>
                            handleApproveUser(user._id, "approved")
                          }
                          className="btn-accent px-6"
                        >
                          ✓ Godkjenn
                        </button>
                        <button
                          onClick={() =>
                            handleApproveUser(user._id, "rejected")
                          }
                          className="px-6 py-3 rounded-full font-bold transition-all transform hover:scale-105 shadow-lg text-white"
                          style={{
                            background:
                              "var(--color-terracotta)",
                          }}
                        >
                          ✕ Avvis
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Products Tab */}
        {activeTab === "products" && (
          <>
            {showProductForm ? (
              <ProductForm
                product={editingProduct}
                onSuccess={handleProductFormSuccess}
                onCancel={handleProductFormCancel}
              />
            ) : (
              <>
                <div className="mb-6">
                  <button
                    onClick={handleAddProduct}
                    className="btn-primary px-8 py-4 text-lg"
                  >
                    ✨ Legg til vare
                  </button>
                </div>

                {loading ? (
                  <div className="container-gradient text-center py-12 animate-fadeIn">
                    <div
                      className="animate-spin rounded-full h-12 w-12 mx-auto mb-4"
                      style={{
                        border: "4px solid rgba(255,255,255,0.3)",
                        borderTopColor: "var(--color-primary)",
                      }}
                    ></div>
                    <p className="text-text-muted font-bold">
                      Laster inn varer...
                    </p>
                  </div>
                ) : products.length === 0 ? (
                  <div className="container-gradient text-center py-12 animate-fadeIn">
                    <p className="text-text-muted text-lg font-bold">
                      📦 Ingen varer i butikken enda. Trykk på "Legg til vare"
                      for å starte!
                    </p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
                    {products.map((product) => (
                      <div
                        key={product._id}
                        className="container-gradient hover:shadow-2xl transition-all transform hover:scale-105"
                      >
                        {/* Product image */}
                        {product.images && product.images[0] ? (
                          <img
                            src={`${API_URL}/uploads/products/${product.images[0]}`}
                            alt={product.name}
                            className="w-full h-40 object-cover rounded-xl mb-3"
                          />
                        ) : (
                          <div className="w-full h-40 rounded-xl mb-3 bg-wine-tint flex items-center justify-center text-4xl">
                            🛍️
                          </div>
                        )}
                        <h3 className="text-xl font-bold gradient-text mb-2">
                          {product.name}
                        </h3>
                        <p className="text-text-muted mb-3 line-clamp-2">
                          {product.description}
                        </p>

                        <div className="flex items-center justify-between mb-3">
                          <span className="text-2xl font-bold text-text">
                            {product.currency === "NOK"
                              ? "kr "
                              : product.currency === "USD"
                                ? "$"
                                : product.currency === "EUR"
                                  ? "€"
                                  : "£"}
                            {product.price.toFixed(2)}
                          </span>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold ${
                              product.isAvailable
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {product.isAvailable
                              ? "✅ Tilgjengelig"
                              : "❌ Ikke tilgjengelig"}
                          </span>
                        </div>

                        <div className="flex gap-2 mb-3 text-xs">
                          <span
                            className="px-3 py-1 rounded-full font-bold text-white"
                            style={{
                              background:
                                "var(--color-primary)",
                            }}
                          >
                            {product.category}
                          </span>
                          <span
                            className="px-3 py-1 rounded-full font-bold text-white"
                            style={{
                              background:
                                "var(--color-secondary)",
                            }}
                          >
                            Antall igjen i butikk: {product.stock}
                          </span>
                        </div>

                        {product.book && (
                          <p className="text-xs text-text-faint mb-3">
                            📚 Relatert til: {product.book.title}
                          </p>
                        )}

                        <div className="flex gap-2 pt-3 border-t border-border">
                          <button
                            onClick={() => handleEditProduct(product)}
                            className="flex-1 btn-secondary py-2 text-sm"
                          >
                            ✏️ Rediger
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product._id)}
                            className="flex-1 py-2 rounded-full font-bold transition-all transform hover:scale-105 shadow-md text-sm text-white"
                            style={{
                              background:
                                "var(--color-terracotta)",
                            }}
                          >
                            🗑️ Slett
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* Orders Tab */}
        {activeTab === "orders" && (
          <>
            {loading ? (
              <div className="container-gradient text-center py-12 animate-fadeIn">
                <div
                  className="animate-spin rounded-full h-12 w-12 mx-auto mb-4"
                  style={{
                    border: "4px solid rgba(255,255,255,0.3)",
                    borderTopColor: "var(--color-primary)",
                  }}
                ></div>
                <p className="text-text-muted font-bold">Laster inn varer...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="container-gradient text-center py-12 animate-fadeIn">
                <p className="text-text-muted text-lg font-bold">
                  📦 Ingen bestillinger enda.
                </p>
              </div>
            ) : (
              <div className="grid gap-6 animate-fadeIn">
                {orders.map((order) => (
                  <div
                    key={order._id}
                    className="container-gradient hover:shadow-2xl transition-all"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-2xl font-bold gradient-text mb-1">
                          Bestilling #{order._id.slice(-6).toUpperCase()}
                        </h3>
                        <p className="text-sm text-text-faint">
                          {new Date(order.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <span
                        className={`px-4 py-2 rounded-full text-sm font-bold ${getStatusColor(order.status)}`}
                      >
                        {order.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <h4 className="font-bold text-text-muted mb-2">
                          Bestillingsdetaljer
                        </h4>
                        <p className="text-text-muted">
                          <strong>Navn:</strong> {order.customerName}
                        </p>
                        <p className="text-text-muted">
                          <strong>Epost:</strong> {order.customerEmail}
                        </p>
                        {order.customerPhone && (
                          <p className="text-text-muted">
                            <strong>Telefon:</strong> {order.customerPhone}
                          </p>
                        )}
                        {order.user && (
                          <p className="text-xs text-text-faint mt-1">
                            Bruker: @{order.user.username}
                          </p>
                        )}
                      </div>

                      <div>
                        {order.deliveryAddress && (
                          <div className="mb-2">
                            <h4 className="font-bold text-text-muted mb-1">
                              Adresse
                            </h4>
                            <p className="text-text-muted text-sm">
                              {order.deliveryAddress}
                            </p>
                          </div>
                        )}
                        {order.notes && (
                          <div>
                            <h4 className="font-bold text-text-muted mb-1">
                              Notater
                            </h4>
                            <p className="text-text-muted text-sm italic">
                              {order.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mb-4">
                      <h4 className="font-bold text-text-muted mb-2">
                        Bestillingsgjenstander
                      </h4>
                      <div className="space-y-2">
                        {order.items.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex justify-between items-center p-3 bg-card rounded-xl"
                          >
                            <div className="flex-1">
                              <p className="font-semibold text-text">
                                {item.productName}
                              </p>
                              {item.product && (
                                <p className="text-xs text-text-faint">
                                  {item.product.category}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-text-muted">
                                <strong>Antall:</strong> {item.quantity}
                              </p>
                              <p className="text-text-muted font-bold">
                                {item.currency === "USD"
                                  ? "$"
                                  : item.currency === "EUR"
                                    ? "€"
                                    : "£"}
                                {(item.price * item.quantity).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div
                        className="mt-3 p-3 rounded-xl text-right"
                        style={{ background: "var(--gradient-secondary)" }}
                      >
                        <p className="text-2xl font-bold text-text">
                          Total: {order.totalAmount.toFixed(2)} kr
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4 border-t border-border">
                      <select
                        value={order.status}
                        onChange={(e) =>
                          handleUpdateOrderStatus(order._id, e.target.value)
                        }
                        className="flex-1 input-field py-2"
                      >
                        <option value="pending">Ventende</option>
                        <option value="confirmed">Bekreftet</option>
                        <option value="shipped">Sendt</option>
                        <option value="delivered">Levert</option>
                        <option value="cancelled">Kansellert</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
        {/* Passwords Tab */}
        {activeTab === "passwords" && (
          <>
            {loading ? (
              <div className="container-gradient text-center py-12 animate-fadeIn">
                <div
                  className="animate-spin rounded-full h-12 w-12 mx-auto mb-4"
                  style={{ border: "4px solid rgba(255,255,255,0.3)", borderTopColor: "var(--color-primary)" }}
                ></div>
                <p className="text-text-muted font-bold">Laster brukere...</p>
              </div>
            ) : allMembers.length === 0 ? (
              <div className="container-gradient text-center py-12 animate-fadeIn">
                <p className="text-text-muted text-lg font-bold">Ingen godkjente brukere funnet.</p>
              </div>
            ) : (
              <div className="grid gap-4 animate-fadeIn">
                {allMembers.map((member) => (
                  <div
                    key={member._id}
                    className="container-gradient hover:shadow-2xl transition-all transform hover:scale-[1.01]"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-xl font-bold gradient-text mb-0.5">
                          {member.displayName || member.username}
                        </h3>
                        <p className="text-text-muted font-semibold text-sm">@{member.username}</p>
                        <p className="text-text-faint text-sm">{member.email}</p>
                      </div>
                      <button
                        onClick={() => handleAdminResetPassword(member._id, member.displayName || member.username)}
                        className="px-6 py-3 rounded-full font-bold transition-all transform hover:scale-105 shadow-lg text-white"
                        style={{ background: "var(--color-secondary-solid)" }}
                      >
                        🔑 Tilbakestill passord
                      </button>
                    </div>

                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
                      <span className="text-sm text-text-faint flex-shrink-0">🎧 Audiobookshelf:</span>
                      <input
                        type="text"
                        placeholder="ABS-brukernavn"
                        value={absUsernameInputs[member._id] ?? member.absUsername ?? ""}
                        onChange={(e) =>
                          setAbsUsernameInputs((prev) => ({ ...prev, [member._id]: e.target.value }))
                        }
                        className="input-field py-1.5 text-sm flex-1 max-w-[200px]"
                      />
                      <button
                        onClick={() => handleSaveAbsUsername(member._id)}
                        disabled={savingAbsUsername === member._id}
                        className="text-xs font-bold px-4 py-1.5 rounded-full text-white disabled:opacity-50"
                        style={{ background: "var(--color-primary-solid)" }}
                      >
                        {savingAbsUsername === member._id ? "..." : "Lagre"}
                      </button>
                      {member.absUsername && (
                        <span className="text-xs text-text-faint flex-shrink-0">
                          {member.absTotalListeningSeconds > 0
                            ? `${(member.absTotalListeningSeconds / 3600).toFixed(1)} t lyttet`
                            : "Ikke synkronisert ennå"}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Requests Tab */}
        {activeTab === "requests" && (
          <>
            {loading ? (
              <div className="container-gradient text-center py-12 animate-fadeIn">
                <div
                  className="animate-spin rounded-full h-12 w-12 mx-auto mb-4"
                  style={{ border: "4px solid rgba(255,255,255,0.3)", borderTopColor: "var(--color-primary)" }}
                ></div>
                <p className="text-text-muted font-bold">Laster forespørsler...</p>
              </div>
            ) : requests.length === 0 ? (
              <div className="container-gradient text-center py-12 animate-fadeIn">
                <p className="text-text-muted text-lg font-bold">📋 Ingen bokforespørsler enda.</p>
              </div>
            ) : (
              <>
                <div className="flex justify-end mb-2">
                  <button
                    onClick={() => setShowArchive(prev => !prev)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:opacity-80 bg-sunken text-text-muted"
                  >
                    {showArchive ? '← Vis aktive' : `🗄 Arkiv${archivedRequestsCount > 0 ? ` (${archivedRequestsCount})` : ''}`}
                  </button>
                </div>
                {visibleRequests.length === 0 ? (
                  <div className="container-gradient text-center py-12 animate-fadeIn">
                    <p className="text-text-muted text-lg font-bold">
                      {showArchive ? '📦 Ingen arkiverte forespørsler.' : '📋 Ingen aktive forespørsler.'}
                    </p>
                  </div>
                ) : (
              <div className="grid gap-4 animate-fadeIn">
                {visibleRequests.map((req) => (
                  <div key={req._id} className="container-gradient hover:shadow-2xl transition-all">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold gradient-text mb-0.5 truncate">{req.title}</h3>
                        <p className="text-text-muted font-semibold mb-2">{req.author}</p>

                        {req.formats && req.formats.length > 0 && (
                          <div className="flex gap-2 mb-2 flex-wrap">
                            {req.formats.map(f => (
                              <span key={f} className="px-2.5 py-0.5 rounded-full text-xs font-bold text-white"
                                style={{ background: 'var(--color-primary)' }}>
                                {FORMAT_LABELS[f] || f}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-sm text-text-faint">
                          <span>Fra: <strong>{req.requestedBy?.displayName || req.requestedBy?.username || 'Ukjent'}</strong></span>
                          <span>·</span>
                          <span>{new Date(req.createdAt).toLocaleDateString('no-NO')}</span>
                        </div>

                        {req.status === 'added' && req.addedBook && (
                          <p className="mt-2 text-sm" style={{ color: "var(--color-sage)" }}>
                            → Lenket til: <strong>{req.addedBook.title}</strong> ({req.addedBook.author})
                          </p>
                        )}
                      </div>

                      <div className="flex-shrink-0 flex flex-col items-end gap-2">
                        {req.status === 'added' && (
                          <span className="px-3 py-1.5 rounded-full text-xs font-bold" style={{ background: "var(--color-sage-tint)", color: "var(--color-sage)" }}>✅ Lagt til</span>
                        )}
                        {req.status === 'dismissed' && (
                          <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-sunken text-text-faint">↩ Trukket tilbake</span>
                        )}
                        {req.status === 'irrelevant' && (
                          <span className="px-3 py-1.5 rounded-full text-xs font-bold" style={{ background: "var(--color-terracotta-tint)", color: "var(--color-terracotta)" }}>✕ Ikke relevant</span>
                        )}
                        {req.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleOpenLinkPicker(req)}
                              className="px-4 py-2 rounded-xl text-white text-sm font-bold transition-all hover:opacity-90"
                              style={{ background: 'var(--color-sage-solid)' }}
                            >
                              ✓ Marker som lagt til
                            </button>
                            <button
                              onClick={() => handleMarkAsIrrelevant(req._id)}
                              className="px-4 py-2 rounded-xl text-sm font-bold transition-all hover:opacity-90 bg-sunken text-text-muted hover:bg-[var(--color-terracotta-tint)] hover:text-[var(--color-terracotta)]"
                            >
                              ✕ Ikke relevant
                            </button>
                            <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: "var(--color-gold-tint)", color: "var(--color-secondary)" }}>Venter</span>
                          </>
                        )}
                      </div>
                    </div>

                    {linkingRequestId === req._id && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <p className="text-sm font-bold text-text-muted mb-2">
                          Søk etter boken som ble lagt til (valgfritt):
                        </p>
                        <input
                          type="text"
                          value={bookSearchQuery}
                          onChange={(e) => handleSearchBooksForLink(e.target.value)}
                          className="input-field mb-2"
                          placeholder="Søk på tittel eller forfatter..."
                          autoFocus
                        />
                        {searchingBooks ? (
                          <p className="text-sm text-text-faint">Søker...</p>
                        ) : bookSearchResults.length > 0 ? (
                          <div className="space-y-1 mb-3">
                            {bookSearchResults.map((b) => (
                              <button
                                key={b._id}
                                onClick={() => setSelectedBookForLink(b)}
                                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                                  selectedBookForLink?._id === b._id
                                    ? "bg-wine-tint border-2 border-primary"
                                    : "bg-card hover:bg-sunken"
                                }`}
                              >
                                <strong>{b.title}</strong> — {b.author}
                              </button>
                            ))}
                          </div>
                        ) : null}
                        <div className="flex gap-3 flex-wrap">
                          <button
                            onClick={() => handleMarkAsAdded(req._id, selectedBookForLink)}
                            disabled={!selectedBookForLink}
                            className="btn-primary px-4 py-2 text-sm disabled:opacity-50"
                          >
                            ✓ Bekreft med valgt bok
                          </button>
                          <button
                            onClick={() => handleMarkAsAdded(req._id, null)}
                            className="px-4 py-2 rounded-xl text-sm font-bold transition-all hover:opacity-90 bg-sunken text-text-muted"
                          >
                            Marker uten å lenke bok
                          </button>
                          <button
                            onClick={handleCloseLinkPicker}
                            className="px-4 py-2 rounded-xl text-sm font-bold transition-all hover:opacity-90 bg-sunken text-text-muted"
                          >
                            Avbryt
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
                )}
              </>
            )}
          </>
        )}
        {/* Books Tab */}
        {activeTab === "books" && (
          <>
            {showBookForm ? (
              <div className="container-gradient animate-fadeIn">
                <AdminBookForm
                  book={null}
                  onSuccess={handleBookFormSuccess}
                  onCancel={() => setShowBookForm(false)}
                />
              </div>
            ) : (
              <div className="container-gradient text-center py-12 animate-fadeIn">
                <div className="text-6xl mb-4">📚</div>
                <h3 className="text-2xl font-bold gradient-text mb-3">Legg til bok manuelt</h3>
                <p className="text-text-muted mb-6">
                  Fyll inn all informasjon selv — inkludert cover, lenker og bokklubbmåned.
                  <br />
                  For å redigere eller slette, gå inn på boken i biblioteket.
                </p>
                <button
                  onClick={() => setShowBookForm(true)}
                  className="btn-primary px-8 py-4 text-lg"
                >
                  ✨ Legg til bok
                </button>
              </div>
            )}
          </>
        )}
        {/* Import Tab */}
        {activeTab === "import" && (
          <div className="grid gap-6 animate-fadeIn">
            <div className="container-gradient">
              <h3 className="text-2xl font-bold gradient-text mb-2">
                📚 Importer bøker (Calibre)
              </h3>
              <p className="text-text-muted mb-4">
                Henter nye og endrede bøker fra Calibre-Web siden datoen under.
              </p>
              <p className="text-sm text-text-faint mb-4">
                Sist importert:{" "}
                <strong>
                  {calibreImportSince
                    ? new Date(calibreImportSince).toLocaleString("no-NO")
                    : "Aldri"}
                </strong>
              </p>
              <div className="flex items-center gap-3 flex-wrap mb-4">
                <input
                  type="date"
                  value={calibreSinceInput}
                  onChange={(e) => setCalibreSinceInput(e.target.value)}
                  className="input-field py-2 w-auto"
                />
                <button
                  onClick={handleSaveCalibreSince}
                  className="btn-secondary px-4 py-2 text-sm"
                >
                  Lagre dato
                </button>
                <button
                  onClick={handleRunCalibreImport}
                  disabled={runningCalibreImport}
                  className="btn-primary px-6 py-3 disabled:opacity-50"
                >
                  {runningCalibreImport ? "Importerer..." : "✨ Importer bøker"}
                </button>
              </div>
              {calibreImportResult && (
                <div className="p-4 rounded-xl text-sm" style={{ background: "var(--color-sage-tint)", color: "var(--color-sage)" }}>
                  Sett gjennom {calibreImportResult.scanned} bøker —{" "}
                  {calibreImportResult.inserted} nye, {calibreImportResult.modified} oppdatert
                  {(calibreImportResult.matchedByCalibreId > 0 || calibreImportResult.matchedExact > 0 || calibreImportResult.matchedFuzzy > 0) &&
                    ` (${calibreImportResult.matchedByCalibreId || 0} via calibre-id, ${calibreImportResult.matchedExact || 0} eksakt, ${calibreImportResult.matchedFuzzy || 0} fuzzy)`}
                  {calibreImportResult.skipped > 0 &&
                    `, ${calibreImportResult.skipped} hoppet over`}
                  .
                </div>
              )}
            </div>

            <div className="container-gradient">
              <h3 className="text-2xl font-bold gradient-text mb-2">
                🎧 Synkroniser lydbøker (Audiobookshelf)
              </h3>
              <p className="text-text-muted mb-4">
                Skanner hele lydboksamlingen og fyller kun inn lydboklenker som mangler —
                overskriver aldri eksisterende lenker.
              </p>
              <button
                onClick={handleRunAbsSync}
                disabled={runningAbsSync}
                className="btn-primary px-6 py-3 disabled:opacity-50"
              >
                {runningAbsSync ? "Synkroniserer..." : "✨ Synkroniser lydbøker"}
              </button>
              {absSyncResult && (
                <div className="mt-4 p-4 rounded-xl text-sm" style={{ background: "var(--color-sage-tint)", color: "var(--color-sage)" }}>
                  Sett gjennom {absSyncResult.scanned} lydbøker —{" "}
                  {absSyncResult.updated} lenker lagt til ({absSyncResult.matchedIsbn} via ISBN,{" "}
                  {absSyncResult.matchedExact} eksakt, {absSyncResult.matchedFuzzy} fuzzy),{" "}
                  {absSyncResult.unmatched} uten treff, {absSyncResult.alreadyLinked} hadde
                  allerede lenke.
                  {absSyncResult.unmatchedItems?.length > 0 && (
                    <>
                      <button
                        onClick={() => setShowUnmatchedAbs((v) => !v)}
                        className="block mt-2 font-bold underline hover:no-underline"
                      >
                        {showUnmatchedAbs ? "Skjul" : "Vis"} bøker uten treff (
                        {absSyncResult.unmatchedItems.length})
                      </button>
                      {showUnmatchedAbs && (
                        <ul className="mt-3 space-y-1.5 max-h-96 overflow-y-auto pr-1">
                          {absSyncResult.unmatchedItems.map((item, i) => (
                            <li
                              key={item.absId || i}
                              className="p-2 rounded-lg bg-sunken flex items-center justify-between gap-3 flex-wrap"
                            >
                              <div>
                                <span className="font-semibold">{item.title}</span>
                                {item.author && <span style={{ color: "var(--color-sage)" }}> — {item.author}</span>}
                                {item.audiobookUrl && (
                                  <a
                                    href={item.audiobookUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ml-2 underline"
                                  >
                                    Se i Audiobookshelf ↗
                                  </a>
                                )}
                              </div>
                              <div className="flex gap-2 flex-shrink-0">
                                <button
                                  onClick={() => setMatchingAbsItem(item)}
                                  className="text-xs font-bold px-3 py-1.5 rounded-full text-white"
                                  style={{ background: "var(--color-primary-solid)" }}
                                >
                                  🔗 Match til bok
                                </button>
                                <button
                                  onClick={() => setAddingAbsItem(item)}
                                  className="text-xs font-bold px-3 py-1.5 rounded-full text-white"
                                  style={{ background: "var(--color-sage-solid)" }}
                                >
                                  ✨ Ny bok
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="container-gradient">
              <h3 className="text-2xl font-bold gradient-text mb-2">
                🎧 Lyttestatistikk (Topp lytter-merket)
              </h3>
              <p className="text-text-muted mb-4">
                Henter total lyttetid fra Audiobookshelf for medlemmer som har fått koblet et
                Audiobookshelf-brukernavn (under "Passord"-fanen). Kjøres automatisk hver natt kl. 03:00,
                men kan også kjøres manuelt her. De to som har lyttet mest får "Topp lytter"-merket på profilen sin.
              </p>
              <button
                onClick={handleRunAbsListeningSync}
                disabled={runningAbsListeningSync}
                className="btn-primary px-6 py-3 disabled:opacity-50"
              >
                {runningAbsListeningSync ? "Synkroniserer..." : "✨ Oppdater lyttestatistikk"}
              </button>
              {absListeningSyncResult && (
                <div className="mt-4 p-4 rounded-xl text-sm" style={{ background: "var(--color-sage-tint)", color: "var(--color-sage)" }}>
                  Sjekket {absListeningSyncResult.checked} koblede medlemmer —{" "}
                  {absListeningSyncResult.matched} oppdatert, {absListeningSyncResult.unmatched} uten
                  treff i Audiobookshelf.
                </div>
              )}
            </div>
          </div>
        )}
        {/* Alerts Tab */}
        {activeTab === "alerts" && (
          <div className="container-gradient animate-fadeIn">
            <h3 className="text-2xl font-bold gradient-text mb-2">🔔 Send varsel</h3>
            <p className="text-text-muted mb-6">
              Sender en e-post til alle medlemmer som har skrudd på «Varsle meg om nye funksjoner» i
              profilen sin. Bruk dette til f.eks. å fortelle om nye funksjoner på siden.
            </p>
            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-sm font-bold text-text-muted mb-2">Tittel</label>
                <input
                  type="text"
                  value={alertSubject}
                  onChange={(e) => setAlertSubject(e.target.value)}
                  className="input-field"
                  placeholder="f.eks. Ny funksjon: Bokønsker!"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-text-muted mb-2">Melding</label>
                <textarea
                  value={alertMessage}
                  onChange={(e) => setAlertMessage(e.target.value)}
                  rows="6"
                  className="input-field"
                  placeholder="Skriv meldingen her. Hvert linjeskift blir et eget avsnitt i e-posten."
                />
              </div>
            </div>
            <button
              onClick={handleSendFeatureAlert}
              disabled={sendingAlert}
              className="btn-primary px-6 py-3 disabled:opacity-50"
            >
              {sendingAlert ? "Sender..." : "✨ Send varsel"}
            </button>
            {alertResult && (
              <div className="mt-4 p-4 rounded-xl text-sm" style={{ background: "var(--color-sage-tint)", color: "var(--color-sage)" }}>
                Sendt til {alertResult.sent} av {alertResult.recipients} mottakere
                {alertResult.failed > 0 && ` (${alertResult.failed} feilet)`}.
              </div>
            )}
          </div>
        )}
        {/* Bokwrapped Tab */}
        {activeTab === "wrapped" && (
          <div className="grid gap-6 animate-fadeIn">
            <div className="container-gradient">
              <h3 className="text-2xl font-bold gradient-text mb-2">
                🎁 Bokwrapped {wrappedYear}
              </h3>
              <p className="text-text-muted mb-4">
                Styr hvor lenge innsamlingen er åpen på forsiden, og se hvordan nominasjonene
                fordeler seg så langt.
              </p>
              <div className="flex items-end gap-3 flex-wrap mb-2">
                <div>
                  <label className="block text-sm font-bold text-text-muted mb-2">
                    Åpner
                  </label>
                  <input
                    type="date"
                    value={wrappedWindowStart}
                    onChange={(e) => setWrappedWindowStart(e.target.value)}
                    className="input-field py-2 w-auto"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-text-muted mb-2">
                    Frist
                  </label>
                  <input
                    type="date"
                    value={wrappedWindowEnd}
                    onChange={(e) => setWrappedWindowEnd(e.target.value)}
                    className="input-field py-2 w-auto"
                  />
                </div>
                <button
                  onClick={handleSaveWrappedWindow}
                  disabled={savingWrappedWindow}
                  className="btn-secondary px-4 py-2 text-sm"
                >
                  {savingWrappedWindow ? "Lagrer..." : "Lagre frist"}
                </button>
              </div>
              <p className="text-sm text-text-faint">
                Banneret på forsiden vises kun i dette tidsrommet.
              </p>
            </div>

            <div className="container-gradient">
              <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                <h3 className="text-2xl font-bold gradient-text">❓ Spørsmål</h3>
                {!showQuestionForm && (
                  <button onClick={handleAddQuestion} className="btn-secondary px-4 py-2 text-sm">
                    ＋ Legg til spørsmål
                  </button>
                )}
              </div>
              <p className="text-text-muted mb-4">
                Velg hvilke kategorier medlemmene svarer på i steg 3, og hvilken type svar hver
                skal ha.
              </p>

              {showQuestionForm && (
                <div
                  className="p-4 rounded-xl mb-4 grid gap-3"
                  style={{ background: "var(--color-sunken)" }}
                >
                  <div>
                    <label className="block text-sm font-bold text-text-muted mb-2">
                      Spørsmål
                    </label>
                    <input
                      type="text"
                      value={questionForm.label}
                      onChange={(e) => setQuestionForm({ ...questionForm, label: e.target.value })}
                      className="input-field"
                      placeholder="f.eks. Årets beste bok"
                    />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-bold text-text-muted mb-2">
                        Svartype
                      </label>
                      <select
                        value={questionForm.type}
                        onChange={(e) => setQuestionForm({ ...questionForm, type: e.target.value })}
                        className="input-field py-2"
                      >
                        <option value="text">Fritekst</option>
                        <option value="number">Tall</option>
                        <option value="book-library">Bok fra biblioteket</option>
                        <option value="book-bookclub">Bok fra årets bokklubbøker</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-text-muted mb-2">
                        Hjelpetekst <span className="font-normal">(valgfritt)</span>
                      </label>
                      <input
                        type="text"
                        value={questionForm.helper}
                        onChange={(e) => setQuestionForm({ ...questionForm, helper: e.target.value })}
                        className="input-field"
                        placeholder="f.eks. navn + bok"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleSaveQuestion}
                      disabled={savingQuestion}
                      className="btn-primary px-4 py-2 text-sm"
                    >
                      {savingQuestion ? "Lagrer..." : "Lagre"}
                    </button>
                    <button
                      onClick={() => {
                        setShowQuestionForm(false);
                        setEditingQuestion(null);
                      }}
                      className="text-sm font-bold text-text-muted"
                    >
                      Avbryt
                    </button>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2">
                {wrappedQuestions.map((question, index) => (
                  <div
                    key={question._id}
                    className="flex items-center gap-3 p-3 rounded-xl"
                    style={{
                      background: "var(--color-sunken)",
                      opacity: question.active ? 1 : 0.5,
                    }}
                  >
                    <div className="flex flex-col">
                      <button
                        onClick={() => handleMoveQuestion(index, -1)}
                        disabled={index === 0}
                        className="text-xs leading-none disabled:opacity-30"
                        title="Flytt opp"
                      >
                        ▲
                      </button>
                      <button
                        onClick={() => handleMoveQuestion(index, 1)}
                        disabled={index === wrappedQuestions.length - 1}
                        className="text-xs leading-none disabled:opacity-30"
                        title="Flytt ned"
                      >
                        ▼
                      </button>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{question.label}</p>
                      <p className="text-xs text-text-faint">
                        {QUESTION_TYPE_LABELS[question.type]}
                        {question.helper && ` · ${question.helper}`}
                        {!question.active && " · skjult"}
                      </p>
                    </div>
                    <button
                      onClick={() => handleEditQuestion(question)}
                      className="text-sm font-bold flex-shrink-0"
                      style={{ color: "var(--color-primary)" }}
                    >
                      Rediger
                    </button>
                    <button
                      onClick={() => handleToggleQuestionActive(question)}
                      className="text-sm font-bold flex-shrink-0 text-text-muted"
                    >
                      {question.active ? "Skjul" : "Vis"}
                    </button>
                    <button
                      onClick={() => handleDeleteQuestion(question)}
                      className="text-sm font-bold flex-shrink-0"
                      style={{ color: "var(--color-terracotta)" }}
                    >
                      Slett
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="container-gradient">
              <h3 className="text-2xl font-bold gradient-text mb-2">📊 Nominasjoner</h3>
              <p className="text-text-muted mb-4">
                {wrappedSubmittedCount} av {wrappedTotalMembers} medlemmer har sendt inn
                nominasjonene sine.
              </p>
              {!wrappedTally ? (
                <p className="text-text-muted">Laster...</p>
              ) : (
                <div className="grid gap-5 md:grid-cols-2">
                  {wrappedQuestions.map((question) => {
                    const answers = wrappedTally[question._id] || [];
                    return (
                      <div
                        key={question._id}
                        className="p-4 rounded-xl"
                        style={{ background: "var(--color-sunken)" }}
                      >
                        <h4 className="font-bold text-sm mb-2">{question.label}</h4>
                        {answers.length === 0 ? (
                          <p className="text-sm text-text-faint">Ingen svar ennå</p>
                        ) : (
                          <ul className="space-y-1.5">
                            {answers.map((a) => (
                              <li key={a.text} className="text-sm flex justify-between gap-3">
                                <span className="truncate" title={a.respondents.join(", ")}>
                                  {a.text}
                                </span>
                                <span
                                  className="font-bold flex-shrink-0"
                                  style={{ color: "var(--color-primary)" }}
                                >
                                  {a.count}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Generated Password Modal */}
      {generatedPassword && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setGeneratedPassword(null)}
        >
          <div
            className="bg-card rounded-3xl p-8 max-w-md w-full animate-fadeIn shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-2xl font-bold gradient-text mb-2">
              🔑 Passord tilbakestilt
            </h3>
            <p className="text-text-muted mb-6">
              Nytt passord for <strong>{generatedPassword.username}</strong>:
            </p>
            <div
              className="p-4 rounded-2xl text-center font-mono text-2xl font-bold tracking-widest mb-6 select-all"
              style={{ background: "var(--color-gold-tint)", border: "2px dashed var(--color-secondary)" }}
            >
              {generatedPassword.password}
            </div>
            <p className="text-sm text-text-faint mb-6 text-center">
              Kopier passordet og del det med brukeren. Det vises bare én gang.
            </p>
            <button
              onClick={() => {
                navigator.clipboard.writeText(generatedPassword.password);
                setSuccessMessage("Passord kopiert!");
                setTimeout(() => setSuccessMessage(""), 3000);
              }}
              className="w-full btn-primary mb-3"
            >
              📋 Kopier passord
            </button>
            <button
              onClick={() => setGeneratedPassword(null)}
              className="w-full py-3 rounded-full font-bold transition-all transform hover:scale-105 shadow-lg"
              style={{ background: "var(--color-text-faint)", color: "white" }}
            >
              Lukk
            </button>
          </div>
        </div>
      )}

      {matchingAbsItem && (
        <MatchAbsItemModal
          item={matchingAbsItem}
          onClose={() => setMatchingAbsItem(null)}
          onMatched={() => handleAbsItemResolved(matchingAbsItem.absId)}
        />
      )}

      {addingAbsItem && (
        <AddBookModal
          initialQuery={`${addingAbsItem.title} ${addingAbsItem.author || ""}`.trim()}
          onClose={() => !linkingNewBook && setAddingAbsItem(null)}
          onCreated={handleNewBookCreated}
        />
      )}
    </div>
  );
};

export default Admin;
