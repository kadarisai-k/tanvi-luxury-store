import { useEffect, useState } from "react";
import { getSettings } from "../api/endpoints";

export default function AnnouncementBar() {
  const [text, setText] = useState("");

  useEffect(() => {
    getSettings()
      .then((s) => setText(s.announcementText || ""))
      .catch(() => setText(""));
  }, []);

  if (!text) return null;

  return (
    <div className="bg-charcoal text-white text-center py-2.5 px-4">
      <p className="nav-link !text-[0.7rem] !tracking-[0.14em]">{text}</p>
    </div>
  );
}
