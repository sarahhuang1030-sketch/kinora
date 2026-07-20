import SharedWatchlistClient from "./SharedWatchlistClient";

type SharedWatchlistPageProps = {
  params: Promise<{
    shareToken: string;
  }>;
};

export default async function SharedWatchlistPage({
  params,
}: SharedWatchlistPageProps) {
  const { shareToken } = await params;

  return (
    <SharedWatchlistClient
      shareToken={shareToken}
    />
  );
}