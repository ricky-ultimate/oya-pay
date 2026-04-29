"use client";

interface WhatsAppMockupProps {
  message: string;
  senderName?: string;
  loading?: boolean;
}

export function WhatsAppMockup({
  message,
  senderName,
  loading,
}: WhatsAppMockupProps) {
  const timeLabel = new Date().toLocaleTimeString("en-NG", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return (
    <div className="flex justify-center py-2">
      <div className="w-56 rounded-3xl border-[3px] border-neutral-800 bg-neutral-800 overflow-hidden shadow-lg">
        <div className="bg-neutral-800 px-4 py-1 flex justify-between items-center">
          <span className="text-white text-xs font-medium tabular-nums">
            {timeLabel}
          </span>
          <div className="flex items-center gap-0.5">
            <div className="w-3 h-1.5 border border-white rounded-sm opacity-70" />
          </div>
        </div>

        <div className="bg-[#075E54] px-2.5 py-2 flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-neutral-300 flex items-center justify-center flex-shrink-0">
            <svg
              className="w-4 h-4 text-neutral-600"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-semibold truncate">
              {senderName ?? "Your Business"}
            </p>
            <p className="text-green-200 text-xs">online</p>
          </div>
        </div>

        <div
          className="px-2.5 py-3 min-h-28"
          style={{
            backgroundColor: "#e5ddd5",
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23c9bfb5' fill-opacity='0.3'%3E%3Cpath d='M0 0h20v20H0V0zm20 20h20v20H20V20z'/%3E%3C/g%3E%3C/svg%3E\")",
          }}
        >
          {loading ? (
            <div className="flex justify-end">
              <div className="bg-[#dcf8c6] rounded-lg rounded-tr-none px-3 py-2 w-32 h-12 animate-pulse" />
            </div>
          ) : (
            <div className="flex justify-end">
              <div className="max-w-[90%] bg-[#dcf8c6] rounded-lg rounded-tr-none px-2.5 py-1.5 shadow-sm">
                <p className="text-neutral-900 text-xs leading-relaxed whitespace-pre-wrap break-words">
                  {message}
                </p>
                <div className="flex items-center justify-end gap-0.5 mt-0.5">
                  <span className="text-neutral-500 text-xs tabular-nums">
                    {timeLabel}
                  </span>
                  <svg
                    className="w-3 h-3 text-[#4fc3f7]"
                    fill="currentColor"
                    viewBox="0 0 18 18"
                  >
                    <path d="M17.394 5.035l-.57-.444a.434.434 0 00-.609.076L8.397 15.442l-4.027-5.696a.434.434 0 00-.608-.103l-.572.416a.437.437 0 00-.1.609l4.753 6.633c.202.28.591.35.88.165.049-.03.093-.067.13-.109l9.282-11.842a.438.438 0 00-.074-.48zm-2.081.002l-.57-.444a.434.434 0 00-.608.076L6.314 15.443l-1.03-1.462c-.202-.28-.59-.35-.88-.165a.437.437 0 00-.17.545l1.699 2.382c.202.28.591.35.88.165.049-.03.093-.067.13-.109l9.281-11.842a.438.438 0 00-.076-.48" />
                  </svg>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-[#f0f0f0] px-2.5 py-1.5 flex items-center gap-1.5">
          <div className="flex-1 bg-white rounded-full px-3 py-1">
            <p className="text-neutral-400 text-xs">Message</p>
          </div>
          <div className="w-6 h-6 rounded-full bg-[#075E54] flex items-center justify-center flex-shrink-0">
            <svg
              className="w-3 h-3 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
