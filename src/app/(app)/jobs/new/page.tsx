"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { createJob } from "@/lib/queries";

export default function CreateJobPage() {
  const { user, profile } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState({
    title: "",
    location: "",
    pay: "",
    date: "",
    time_start: "",
    time_end: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile && profile.role !== "employer") {
      router.replace("/jobs");
    }
  }, [profile, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile || profile.role !== "employer") return;

    setLoading(true);

    // Calculate approx duration string, e.g., "5 hod"
    const st = parseInt(formData.time_start.split(":")[0]) || Number(formData.time_start);
    const et = parseInt(formData.time_end.split(":")[0]) || Number(formData.time_end);
    let dur = "";
    if (!isNaN(st) && !isNaN(et)) {
      const diff = et > st ? et - st : (et + 24) - st;
      dur = `${diff} hod`;
    } else {
      dur = `${formData.time_start} - ${formData.time_end}`;
    }

    await createJob({
      employer_id: user.id,
      company: profile.company_name || profile.name || "Neznámá firma",
      title: formData.title,
      location: formData.location,
      lat: null,
      lng: null,
      pay: Number(formData.pay),
      date: formData.date,
      time_start: formData.time_start,
      time_end: formData.time_end,
      duration: dur,
      description: formData.description,
      pay_unit: "/ hod",
      tips: true,
      requirements: ["Spolehlivost", "Chuť do práce"],
      tags: [formData.title.split(" ")[0]],
      image_url: "https://images.unsplash.com/photo-1559925393-8be0ec4767c8?auto=format&fit=crop&q=80&w=800",
    });

    setLoading(false);
    router.push("/profile");
  };

  return (
    <div className="flex flex-col h-full bg-transparent relative z-20">
      <header className="flex items-center justify-between px-6 py-4 border-b border-border/50">
        <button onClick={() => router.back()} className="flex items-center justify-center size-10 rounded-full bg-card hover:bg-muted transition-colors">
          {/* @ts-expect-error - web component */}
          <iconify-icon icon="solar:alt-arrow-left-bold" class="size-5" />
        </button>
        <h1 className="font-heading text-xl font-bold">Nová brigáda</h1>
        <div className="size-10" />
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-6 max-w-md mx-auto">
          <div>
            <label className="block text-sm font-bold text-foreground mb-2">Pozice</label>
            <input
              required
              type="text"
              placeholder="Např. Barista, Číšník..."
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 bg-card border border-border/50 rounded-xl focus:ring-2 focus:ring-primary outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-foreground mb-2">Lokace</label>
              <input
                required
                type="text"
                placeholder="Centrum, Praha"
                value={formData.location}
                onChange={e => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-3 bg-card border border-border/50 rounded-xl focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-foreground mb-2">Odměna (Kč/hod)</label>
              <input
                required
                type="number"
                placeholder="150"
                value={formData.pay}
                onChange={e => setFormData({ ...formData, pay: e.target.value })}
                className="w-full px-4 py-3 bg-card border border-border/50 rounded-xl focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-foreground mb-2">Datum</label>
            <input
              required
              type="text"
              placeholder="Zítra, 15.11."
              value={formData.date}
              onChange={e => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-4 py-3 bg-card border border-border/50 rounded-xl focus:ring-2 focus:ring-primary outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-foreground mb-2">Začátek vr.</label>
              <input
                required
                type="text"
                placeholder="08:00"
                value={formData.time_start}
                onChange={e => setFormData({ ...formData, time_start: e.target.value })}
                className="w-full px-4 py-3 bg-card border border-border/50 rounded-xl focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-foreground mb-2">Konec vr.</label>
              <input
                required
                type="text"
                placeholder="16:00"
                value={formData.time_end}
                onChange={e => setFormData({ ...formData, time_end: e.target.value })}
                className="w-full px-4 py-3 bg-card border border-border/50 rounded-xl focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-foreground mb-2">Popis (volitelně)</label>
            <textarea
              placeholder="Co bude náplní práce..."
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 bg-card border border-border/50 rounded-xl focus:ring-2 focus:ring-primary outline-none h-32 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-xl font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            {loading ? "Vytvářím..." : "Vytvořit brigádu"}
          </button>
        </form>
      </div>
    </div>
  );
}
