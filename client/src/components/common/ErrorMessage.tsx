interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export function ErrorMessage({
  message,
  onRetry,
  retryLabel = '重试',
}: ErrorMessageProps) {
  return (
    <div className="error" role="alert">
      <p>{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry}>
          {retryLabel}
        </button>
      )}
    </div>
  );
}
