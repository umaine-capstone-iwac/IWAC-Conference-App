// -- FILTER USERS -- //

// - Filters messages by first name, last name, or full name
// - Sorts alphabetically by last name, then first name.

export type User = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url?: string | null;
};

export function filterUsers(users: User[], search: string): User[] {
  // Normalize search input for consistent matching
  const query = search.trim().toLowerCase();

  const filtered = !query
    ? // If search is empty, skip filtering and return full list
      users
    : // Else, match against first name, last name, or full name
      users.filter((user) => {
        const first = user.first_name?.toLowerCase() ?? '';
        const last = user.last_name?.toLowerCase() ?? '';
        const fullName = `${first} ${last}`.trim();

        return (
          first.includes(query) ||
          last.includes(query) ||
          fullName.includes(query)
        );
      });

  // Sort names alphabetical by last name, then first name
  return [...filtered].sort((a, b) => {
    const aLast = a.last_name ?? '';
    const bLast = b.last_name ?? '';

    if (aLast !== bLast) {
      return aLast.localeCompare(bLast);
    }

    const aFirst = a.first_name ?? '';
    const bFirst = b.first_name ?? '';

    return aFirst.localeCompare(bFirst);
  });
}
