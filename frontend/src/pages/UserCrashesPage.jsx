import React, { useEffect, useState } from "react";
import { fetchUserCrashes, fetchCrashById } from "../api/crashApi";
import CrashCard from "./CrashCard";
import CrashViewer from "./CrashViewer";

export default function UserCrashesPage({ user }) {
  const [crashes, setCrashes] = useState([]);
  const [selectedCrash, setSelectedCrash] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (!user) return;
    setCrashes([]);
    setPage(0);
    setHasMore(true);
    loadCrashes(0);
  }, [user]);

  const loadCrashes = async (pageNum) => {
    setLoading(true);
    try {
      const data = await fetchUserCrashes(user.id, { page: pageNum, size: 20 });
      if (data.length === 0) setHasMore(false);
      setCrashes((prev) => [...prev, ...data]);
      setPage(pageNum);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const openCrash = async (crash) => {
    // Повторное нажатие — закрытие
    if (selectedCrash && selectedCrash.id === crash.id) {
      setSelectedCrash(null);
      return;
    }
    try {
      const full = await fetchCrashById(crash.id);
      setSelectedCrash(full);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-panel p-4 rounded-md flex justify-between items-center">
        <div>
          <div className="text-xl font-bold">{user.username}</div>
          <div className="text-textSecondary text-sm">
            Total crashes: {user.crashesCount ?? crashes.length}
          </div>
        </div>
      </div>

      <div>
        {crashes.map((crash) => (
          <CrashCard key={crash.id} crash={crash} onView={openCrash} />
        ))}

        {loading && <div className="text-textSecondary mt-2">Loading...</div>}
        {!loading && hasMore && (
          <button
            onClick={() => loadCrashes(page + 1)}
            className="bg-accentRed text-white px-4 py-2 rounded-md mt-3 hover:opacity-90"
          >
            Load more
          </button>
        )}
      </div>

      {selectedCrash && (
        <div className="mt-6">
          <CrashViewer crash={selectedCrash} />
        </div>
      )}
    </div>
  );
}