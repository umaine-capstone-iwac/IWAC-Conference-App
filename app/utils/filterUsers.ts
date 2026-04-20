// -- FILTER USERS -- //

// - Filters users by first name, last name, or full name
// - Sorts alphabetically by last name, then first name

export type User = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url?: string | null;
};

export function filterUsers<T extends User>(users: T[], search: string): T[] {
  // Normalize search input for consistent matching
  const query = search.trim().toLowerCase();

  // Check whether a user matches the search query
  const matches = (user: User) => {
    const first = user.first_name?.toLowerCase() ?? '';
    const last = user.last_name?.toLowerCase() ?? '';

    if (!query) return true;

    return (
      first.includes(query) ||
      last.includes(query) ||
      `${first} ${last}`.includes(query)
    );
  };

  // Safely normalize values for sorting, in case of nulls
  const safe = (v: string | null) => v?.toLowerCase() ?? 'zzzzzz';
  return (
    users
      // Apply search filter
      .filter(matches)

      // Sort alphabetically by last name, then first name
      .sort((a, b) => {
        const lastCompare = safe(a.last_name).localeCompare(
          safe(b.last_name),
          undefined,
          { sensitivity: 'base' },
        );

        if (lastCompare !== 0) return lastCompare;

        return safe(a.first_name).localeCompare(safe(b.first_name), undefined, {
          sensitivity: 'base',
        });
      })
  );
}
