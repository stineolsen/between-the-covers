import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { meetingsApi } from "../api/meetingsApi";
import { useToast } from "../contexts/useToast";
import MeetingCard from "../components/meetings/MeetingCard";
import MeetingForm from "../components/meetings/MeetingForm";

const MeetingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  const fetchMeeting = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await meetingsApi.getMeeting(id);
      setMeeting(data.meeting);
    } catch (err) {
      setError(err.response?.data?.message || "Fant ikke møtet");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeeting();
  }, [id]);

  const handleRSVP = async (meetingId) => {
    try {
      const data = await meetingsApi.rsvpMeeting(meetingId);
      setMeeting(data.meeting);
      toast.success(
        data.isAttending
          ? "Du er nå registrert for møtet!"
          : "Din RSVP har blitt fjernet",
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "Greide ikke RSVP til møtet");
    }
  };

  const handleFormSuccess = () => {
    toast.success("Møte oppdatert!");
    setShowForm(false);
    fetchMeeting();
  };

  const handleDelete = async (meetingId) => {
    if (
      !window.confirm(
        "Er du sikker på at du vil slette dette møtet? Dette kan ikke angres.",
      )
    ) {
      return;
    }

    try {
      await meetingsApi.deleteMeeting(meetingId);
      toast.success("Møtet slettet");
      navigate("/meetings");
    } catch (err) {
      toast.error(err.response?.data?.message || "Greide ikke slette møte");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen py-8">
        <div className="max-w-2xl mx-auto px-4 text-center py-20 animate-fadeIn">
          <div
            className="animate-spin rounded-full h-16 w-16 mx-auto"
            style={{
              border: "4px solid rgba(107, 91, 149, 0.3)",
              borderTopColor: "var(--color-primary)",
            }}
          />
        </div>
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="min-h-screen py-8">
        <div className="max-w-2xl mx-auto px-4 text-center py-20 animate-fadeIn">
          <p className="text-lg mb-4" style={{ color: "var(--color-terracotta)" }}>
            {error || "Fant ikke møtet"}
          </p>
          <Link
            to="/meetings"
            className="font-semibold"
            style={{ color: "var(--color-primary)" }}
          >
            ← Tilbake til møter
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-2xl mx-auto px-4">
        <Link
          to="/meetings"
          className="inline-block mb-6 text-sm font-semibold"
          style={{ color: "var(--color-primary)" }}
        >
          ← Tilbake til møter
        </Link>

        {showForm ? (
          <MeetingForm
            meeting={meeting}
            onSuccess={handleFormSuccess}
            onCancel={() => setShowForm(false)}
          />
        ) : (
          <MeetingCard
            meeting={meeting}
            onRSVP={handleRSVP}
            onEdit={() => setShowForm(true)}
            onDelete={handleDelete}
          />
        )}
      </div>
    </div>
  );
};

export default MeetingDetail;
