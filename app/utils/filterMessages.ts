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

  const filtered = !query
    ? // If no search, just sort
      users
    : // Otherwise, first filter text for matches to first name, last name, or full name
      users.filter((user) => {
        const first = user.first_name?.toLowerCase() ?? '';
        const last = user.last_name?.toLowerCase() ?? '';
        const fullName = `${first} ${last}`.trim();

        return fullName.includes(query);
      });

  // Sort descending so most recent conversations appear first
  return [...filtered].sort((a, b) => {
    const aTime = a.timestamp ? Date.parse(a.timestamp) : 0;
    const bTime = b.timestamp ? Date.parse(b.timestamp) : 0;
    return bTime - aTime;
  });
}
