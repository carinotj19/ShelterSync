import { useContext, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import PropTypes from "prop-types";
import {
  HiBadgeCheck,
  HiCalendar,
  HiLocationMarker,
  HiSparkles,
  HiColorSwatch,
  HiScale,
  HiArrowsExpand,
  HiChevronLeft,
  HiChevronRight,
  HiMail,
  HiShare,
  HiOutlineHeart,
  HiHeart,
} from "react-icons/hi";
import { AuthContext } from "../AuthContext";
import { petsAPI, adoptionAPI } from "../utils/api";

export default function PetDetail() {
  const { id } = useParams();
  const { role } = useContext(AuthContext);

  const [pet, setPet] = useState(null);
  const [message, setMessage] = useState("");
  const [currentImage, setCurrentImage] = useState(0);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const { data } = await petsAPI.getPet(id);
        const p = data?.data?.pet || data?.pet || data;
        setPet(p);
        setError("");
      } catch {
        setError("Unable to load pet");
      }
    })();
  }, [id]);

  // seed initial "saved" state from localStorage
  useEffect(() => {
    if (!pet?.id) return;
    const savedIds = JSON.parse(localStorage.getItem("savedPets") || "[]");
    setSaved(savedIds.includes(pet.id));
  }, [pet?.id]);

  const defaultImage = "https://placehold.co/1200x800?text=No+Image";
  const images = useMemo(() => {
    if (!pet) return [defaultImage];
    if (pet.images?.length) return pet.images;
    if (pet.imageUrl || pet.imageURL) return [pet.imageUrl || pet.imageURL];
    return [defaultImage];
  }, [pet]);

  const statusStyle = (s) => {
    switch ((s || "").toLowerCase()) {
      case "available":
        return "badge bg-green-100 text-green-700 border border-green-200";
      case "pending":
        return "badge bg-yellow-100 text-yellow-700 border border-yellow-200";
      case "adopted":
        return "badge bg-red-100 text-red-700 border border-red-200";
      default:
        return "badge bg-gray-100 text-gray-700 border border-gray-200";
    }
  };

  const toggleSave = () => {
    if (!pet?.id) return;
    const savedIds = JSON.parse(localStorage.getItem("savedPets") || "[]");
    const next = saved ? savedIds.filter((x) => x !== pet.id) : [...new Set([...savedIds, pet.id])];
    localStorage.setItem("savedPets", JSON.stringify(next));
    setSaved(!saved);
    setSuccess(saved ? "Removed from saved." : "Saved for later.");
    setTimeout(() => setSuccess(""), 1600);
  };

  const shareLink = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({
          title: pet?.name ? `${pet.name} • ShelterSync` : "ShelterSync",
          text: pet?.breed ? `${pet.name} — ${pet.breed}` : pet?.name,
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        setSuccess("Link copied to clipboard.");
        setTimeout(() => setSuccess(""), 1600);
      }
    } catch {
      // user cancelled; no-op
    }
  };

  const onAdopt = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      await adoptionAPI.createRequest(id, { message });
      setSuccess("Adoption request sent.");
      setMessage("");
    } catch (err) {
      setError(err.response?.data?.message || "Request failed");
    }
  };

  if (!pet) {
    return (
      <div className="relative min-h-[60vh] grid place-items-center">
      </div>
    );
  }

  return (
    <div className="relative py-10">
      <div className="mx-auto grid w-[min(1100px,92vw)] gap-8 lg:grid-cols-12">
        {/* Gallery */}
        <section className="lg:col-span-7">
          <div className="relative overflow-hidden rounded-3xl glass">
            <div className="relative aspect-[4/3]">
              <img
                src={images[currentImage] || defaultImage}
                alt={pet.name}
                onError={(e) => {
                  if (e.currentTarget.src !== defaultImage) {
                    e.currentTarget.src = defaultImage;
                  }
                }}
                className="h-full w-full object-cover"
              />

              {/* Floating actions */}
              <div className="absolute right-4 top-4 flex gap-2">
                <button
                  type="button"
                  onClick={shareLink}
                  className="grid h-11 w-11 place-items-center rounded-full bg-white/90 shadow hover:bg-white focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-brand"
                  aria-label="Share"
                  title="Share"
                >
                  <HiShare className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={toggleSave}
                  className={`grid h-11 w-11 place-items-center rounded-full shadow focus:outline-none focus:ring-4 focus:ring-offset-2 ${
                    saved ? "bg-brand text-white" : "bg-white/90 hover:bg-white focus:ring-brand"
                  }`}
                  aria-label={saved ? "Unsave" : "Save"}
                  title={saved ? "Unsave" : "Save"}
                >
                  {saved ? <HiHeart className="h-5 w-5" /> : <HiOutlineHeart className="h-5 w-5" />}
                </button>
              </div>

              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentImage((p) => (p === 0 ? images.length - 1 : p - 1))
                    }
                    className="absolute left-4 top-1/2 -translate-y-1/2 grid h-10 w-10 place-items-center rounded-full bg-white/90 shadow hover:bg-white focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-brand"
                    aria-label="Previous image"
                  >
                    <HiChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentImage((p) => (p === images.length - 1 ? 0 : p + 1))
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 grid h-10 w-10 place-items-center rounded-full bg-white/90 shadow hover:bg-white focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-brand"
                    aria-label="Next image"
                  >
                    <HiChevronRight className="h-5 w-5" />
                  </button>

                  {/* dots */}
                  <div className="absolute bottom-3 left-0 right-0 mx-auto flex items-center justify-center gap-2">
                    {images.map((_, i) => (
                      <span
                        key={i}
                        className={`h-1.5 w-6 rounded-full transition ${
                          i === currentImage ? "bg-black/70" : "bg-black/30"
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-3 p-3 overflow-x-auto">
                {images.map((src, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setCurrentImage(i)}
                    className={`relative h-20 w-28 shrink-0 overflow-hidden rounded-xl ring-2 transition ${
                      i === currentImage
                        ? "ring-black/60"
                        : "ring-transparent hover:ring-black/20"
                    }`}
                    aria-label={`Show image ${i + 1}`}
                  >
                    <img
                      src={src}
                      alt=""
                      className="h-full w-full object-cover"
                      onError={(e) => (e.currentTarget.src = defaultImage)}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Info + actions */}
        <aside className="lg:col-span-5 lg:sticky lg:top-8 space-y-6">
          <div className="card p-6">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">{pet.name}</h1>
              {pet.adoptionStatus && (
                <span className={statusStyle(pet.adoptionStatus)}>
                  {pet.adoptionStatus}
                </span>
              )}
            </div>

            {/* quick chips */}
            <div className="mt-4 flex flex-wrap gap-2 text-sm">
              {pet.breed && (
                <span className="badge bg-blue-50 text-blue-700 border border-blue-200">
                  <HiSparkles className="mr-1 h-4 w-4" /> {pet.breed}
                </span>
              )}
              {pet.age != null && (
                <span className="badge bg-gray-100 text-gray-700 border border-gray-200">
                  <HiCalendar className="mr-1 h-4 w-4" /> {pet.age} yrs
                </span>
              )}
              {pet.location && (
                <span className="badge bg-teal-50 text-teal-700 border border-teal-200">
                  <HiLocationMarker className="mr-1 h-4 w-4" /> {pet.location}
                </span>
              )}
              {pet.size && (
                <span className="badge bg-purple-50 text-purple-700 border border-purple-200">
                  <HiArrowsExpand className="mr-1 h-4 w-4" /> {String(pet.size).toLowerCase()}
                </span>
              )}
            </div>

            {/* details grid */}
            <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 text-sm text-gray-700">
              {pet.sex && <Attr icon={HiBadgeCheck} label="Sex" value={String(pet.sex).toLowerCase()} />}
              {pet.weight && <Attr icon={HiScale} label="Weight" value={pet.weight} />}
              {pet.color && <Attr icon={HiColorSwatch} label="Color" value={String(pet.color).toLowerCase()} />}
            </dl>

            {pet.healthNotes && (
              <p className="mt-4 text-gray-700 leading-relaxed">{pet.healthNotes}</p>
            )}

            {(pet.personality || pet.background) && (
              <div className="mt-4 space-y-2">
                <h3 className="text-sm font-semibold tracking-wide text-gray-900">
                  About
                </h3>
                {pet.personality && <p className="text-gray-700">{pet.personality}</p>}
                {pet.background && <p className="text-gray-700">{pet.background}</p>}
              </div>
            )}
          </div>

          {/* Adopt form */}
          {role === "adopter" &&
            String(pet.adoptionStatus).toLowerCase() === "available" && (
              <div className="card p-6">
                <form onSubmit={onAdopt} className="space-y-3">
                  <label className="block text-sm font-medium text-gray-800">
                    Message to shelter
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    required
                    className="input"
                    placeholder="Share why you’re a great match…"
                  />
                  <button type="submit" className="btn-primary w-full">
                    Send adoption request
                  </button>
                </form>
              </div>
            )}

          {(success || error) && (
            <div
              className={`rounded-xl p-3 text-sm ${
                success
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {success || error}
            </div>
          )}

          {/* Shelter card */}
          {pet.shelter && (
            <div className="card p-6">
              <h3 className="text-sm font-semibold text-gray-900">
                Shelter Information
              </h3>
              <div className="mt-2 space-y-1 text-sm text-gray-700">
                {pet.shelter.name && <p><strong>Name:</strong> {pet.shelter.name}</p>}
                {pet.shelter.phone && <p><strong>Phone:</strong> {pet.shelter.phone}</p>}
                {pet.shelter.email && <p><strong>Email:</strong> {pet.shelter.email}</p>}
              </div>

              {pet.shelter.email && (
                <button
                  type="button"
                  onClick={() =>
                    (window.location.href = `mailto:${pet.shelter.email}?subject=${encodeURIComponent(
                      `Inquiry about ${pet.name}`
                    )}`)
                  }
                  className="btn-outline mt-4"
                >
                  <HiMail className="mr-2 h-5 w-5" />
                  Contact shelter
                </button>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function Attr({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-5 w-5 text-gray-400" />
      <div className="min-w-0">
        <dt className="sr-only">{label}</dt>
        <dd className="truncate capitalize">{value}</dd>
      </div>
    </div>
  );
}

Attr.propTypes = {
  icon: PropTypes.elementType.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
};