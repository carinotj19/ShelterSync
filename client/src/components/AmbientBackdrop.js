export default function AmbientBackdrop() {
    return (
        <div
            className="
          pointer-events-none fixed inset-0 -z-10
          bg-[radial-gradient(60%_60%_at_15%_10%,rgba(59,130,246,0.10),transparent),
              radial-gradient(50%_50%_at_85%_15%,rgba(34,197,94,0.10),transparent)]
        "
        />
    );
}
