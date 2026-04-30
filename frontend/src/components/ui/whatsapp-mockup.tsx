interface WhatsAppMockupProps {
  message: string;
  loading?: boolean;
  senderName?: string;
}

export function WhatsAppMockup({
  message,
  loading = false,
  senderName,
}: WhatsAppMockupProps) {
  return (
    <div className="bg-[#ece5dd] rounded-xl p-4">
      {senderName && (
        <p className="text-xs font-semibold text-[#128C7E] mb-2 px-1">
          {senderName}
        </p>
      )}
      <div className="flex justify-end">
        <div className="max-w-[85%] bg-[#dcf8c6] rounded-xl rounded-tr-sm px-3 py-2 shadow-sm">
          {loading ? (
            <div className="flex gap-1 items-center py-1 px-2">
              <div
                className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce"
                style={{ animationDelay: "0ms" }}
              />
              <div
                className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce"
                style={{ animationDelay: "150ms" }}
              />
              <div
                className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce"
                style={{ animationDelay: "300ms" }}
              />
            </div>
          ) : (
            <p className="text-sm text-neutral-900 whitespace-pre-wrap leading-relaxed">
              {message}
            </p>
          )}
          <p className="text-right text-[10px] text-neutral-400 mt-1">now</p>
        </div>
      </div>
    </div>
  );
}
