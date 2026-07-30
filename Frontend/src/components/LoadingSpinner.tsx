import { Loader2 } from 'lucide-react';

interface Props {
  message?: string;
}

export function LoadingSpinner({ message }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--color-accent)' }} />
      {message && (
        <p className="mt-3 text-sm" style={{ color: 'var(--color-muted)' }}>
          {message}
        </p>
      )}
    </div>
  );
}
