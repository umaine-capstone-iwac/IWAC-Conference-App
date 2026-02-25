type MessageUser = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  lastMessage: string | null;
  timestamp: string | null;
};

export function filterMessages(
  users: MessageUser[],
  search: string,
): MessageUser[] {
  const query = search.trim().toLowerCase();

  const filtered = users.filter((user) => {
    const first = user.first_name?.toLowerCase() ?? '';
    const last = user.last_name?.toLowerCase() ?? '';
    const fullName = `${first} ${last}`.trim();

    return (
      first.includes(query) || last.includes(query) || fullName.includes(query)
    );
  });

  return [...filtered].sort((a, b) => {
    const aTime = a.timestamp ?? '';
    const bTime = b.timestamp ?? '';
    return bTime.localeCompare(aTime); //Put newest message first
  });
}
