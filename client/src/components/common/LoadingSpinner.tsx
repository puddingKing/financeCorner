interface LoadingSpinnerProps {
  message?: string;
}

export function LoadingSpinner({ message = '加载中…' }: LoadingSpinnerProps) {
  return (
    <div className="status" role="status">
      <div className="spinner" aria-hidden />
      <span>{message}</span>
    </div>
  );
}
