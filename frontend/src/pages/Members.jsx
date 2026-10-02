import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { usersApi } from "../api/usersApi";
import UserAvatar from "../components/common/UserAvatar";

const Members = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    usersApi
      .getMembers()
      .then((data) => setMembers(data.members || []))
      .catch((err) =>
        setError(err.response?.data?.message || "Klarte ikke laste medlemmer"),
      )
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8 animate-fadeIn">
          <h1 className="text-5xl font-bold gradient-text mb-3">Medlemmer</h1>
          <p className="text-gray-700 text-lg">
            {members.length} {members.length === 1 ? "medlem" : "medlemmer"}
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-[var(--color-wine-tint)] border-t-[var(--color-primary)] rounded-full animate-spin" />
          </div>
        ) : error ? (
          <p
            className="text-center py-16"
            style={{ color: "var(--color-terracotta)" }}
          >
            {error}
          </p>
        ) : members.length === 0 ? (
          <p className="text-center text-text-faint py-16">
            Ingen medlemmer funnet.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {members.map((member) => (
              <Link
                key={member._id}
                to={`/members/${member._id}`}
                className="card p-4 rounded-2xl flex flex-col items-center text-center gap-2 hover:opacity-90 transition-opacity"
              >
                <UserAvatar
                  user={member}
                  className="w-16 h-16 rounded-full text-xl"
                />
                <div className="min-w-0 w-full">
                  <p className="font-semibold text-sm truncate">
                    {member.displayName || member.username}
                  </p>
                  <p
                    className="text-xs truncate"
                    style={{ color: "var(--color-text-faint)" }}
                  >
                    @{member.username}
                  </p>
                  {member.currentlyReading?.length > 0 && (
                    <p
                      className="text-xs truncate mt-1"
                      title={member.currentlyReading
                        .map((book) => book.title)
                        .join(", ")}
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      📖{" "}
                      {member.currentlyReading
                        .map((book) => book.title)
                        .join(", ")}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Members;
