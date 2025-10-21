import React, { useEffect, useState } from "react";
import { fetchGlobalCrashes, fetchCrashById } from "../api/crashApi";
import { useParams } from "react-router-dom";
import CrashCard from "../components/CrashCard";
import CrashViewer from "../components/CrashViewer";

export default function ExceptionDetailPage() {
  const { type } = useParams();
  const [crashes, setCrashes] = useState([]);
  const [selectedCrash, setSelectedCrash] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, [type]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchGlobalCrashes({ q: type, grouped: false });
      setCrashes(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const openCrash = async (crash) => {
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
    <div>
      <h2 className="text-xl font-semibold mb-4">
        Logs for: <span className="text-accentTeal">{type}</span>
      </h2>

      {loading && <div className="text-textSecondary">Loading...</div>}

      {!loading && crashes.length === 0 && (
        <div className="text-textSecondary">No crashes found for this exception</div>
      )}

      {!loading &&
        crashes.map((c) => <CrashCard key={c.id} crash={c} onView={openCrash} />)}

      {selectedCrash && (
        <div className="mt-6">
          <CrashViewer crash={selectedCrash} />
        </div>
      )}
    </div>
  );
}
