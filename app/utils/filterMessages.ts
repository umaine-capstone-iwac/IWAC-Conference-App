// -- FILTER MESSAGES -- //

// - Filters users by first name, last name, or full name (case-insensitive),
// - Sorts results by most recent message timestamp (newest first).

export function filterMessages<
  T extends {
    first_name: string | null;
    last_name: string | null;
    timestamp?: string | null;
  },
>(users: T[], search: string): T[] {
  // Normalize search input for case-insensitive matching
  const query = search.trim().toLowerCase();

  // Filter text for matches to first name, last name, or full name
  const filtered = users.filter((user) => {
    const first = user.first_name?.toLowerCase() ?? '';
    const last = user.last_name?.toLowerCase() ?? '';
    const fullName = `${first} ${last}`.trim();

    return (
      first.includes(query) || last.includes(query) || fullName.includes(query)
    );
  });

  // Sort descending so most recent conversations appear first
  return [...filtered].sort((a, b) => {
    const aTime = a.timestamp ?? '';
    const bTime = b.timestamp ?? '';
    return bTime.localeCompare(aTime);
  });
}
