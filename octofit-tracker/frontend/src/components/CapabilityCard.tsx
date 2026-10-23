import type { ReactNode } from 'react';

type Props = {
  title: string;
  description: string;
  isLoading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  children?: ReactNode;
};

export function CapabilityCard({ title, description, isLoading = false, error, emptyMessage, children }: Props) {
  const hasContent = !!children;

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">{title}</h2>
        <p>{description}</p>
        {isLoading ? <p role="status">Loading...</p> : null}
        {!isLoading && error ? <div role="alert">{error}</div> : null}
        {!isLoading && !error && hasContent ? children : null}
        {!isLoading && !error && !hasContent && emptyMessage ? <p>{emptyMessage}</p> : null}
      </div>
    </section>
  );
}
