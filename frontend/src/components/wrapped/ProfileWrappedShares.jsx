import { useEffect, useState } from "react";
import wrappedApi from "../../api/wrappedApi";
import { useToast } from "../../contexts/useToast";
import WrappedMiniCard from "./WrappedMiniCard";

// A member's shared Bokwrapped summaries (newest year first) on their
// profile. On your own profile each card can be taken down again.
const ProfileWrappedShares = ({ userId, isOwn = false }) => {
  const toast = useToast();
  const [shares, setShares] = useState([]);

  useEffect(() => {
    if (!userId) return;
    wrappedApi
      .getUserShares(userId)
      .then((data) => setShares(data.shares || []))
      .catch(() => {});
  }, [userId]);

  const remove = async (year) => {
    try {
      await wrappedApi.unshareResults(year);
      setShares((list) => list.filter((s) => s.year !== year));
      toast.success("Fjernet fra profilen og forsiden");
    } catch (err) {
      toast.error(err.response?.data?.message || "Klarte ikke fjerne delingen");
    }
  };

  if (shares.length === 0) return null;

  return (
    <div className="w-full max-w-xl mt-4">
      <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: "var(--color-text-muted)" }}>
        Bokwrapped
      </p>
      <div className="grid gap-3 sm:grid-cols-2 text-left">
        {shares.map((share) => (
          <WrappedMiniCard
            key={share._id}
            share={share}
            onRemove={isOwn ? () => remove(share.year) : undefined}
          />
        ))}
      </div>
    </div>
  );
};

export default ProfileWrappedShares;
