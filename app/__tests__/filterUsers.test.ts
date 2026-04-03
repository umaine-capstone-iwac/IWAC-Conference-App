import { filterUsers, User } from '../utils/filterUsers';

const users: User[] = [
  { id: '1', first_name: null, last_name: 'Curie' },
  { id: '2', first_name: 'Alice', last_name: 'Zephyr' },
  { id: '3', first_name: 'Bob', last_name: 'Yellow' },
  { id: '4', first_name: 'Charlie', last_name: 'Yellow' },
  { id: '5', first_name: null, last_name: 'Yellow' },
  { id: '6', first_name: 'David', last_name: null },
  { id: '7', first_name: null, last_name: null },
];

describe('filterUsers', () => {
  test('returns all users sorted alphabetically for an empty search', () => {
    const result = filterUsers(users, '');

    expect(result.map((u) => u.id)).toEqual([
      '1', // (first null) Curie
      '3', // Bob Yellow
      '4', // Charlie Yellow
      '5', // (first null) Yellow
      '2', // Alice Zephyr
      '6', // David (last null)
      '7', // (first null) (last null)
    ]);
  });

  test('filters by first name', () => {
    const result = filterUsers(users, 'ali');

    expect(result).toHaveLength(1);
    expect(result[0].first_name).toBe('Alice');
  });

  test('filters by last name', () => {
    const result = filterUsers(users, 'yellow');

    expect(result.map((u) => u.first_name)).toEqual(['Bob', 'Charlie', null]);
  });

  test('filters by full name', () => {
    const result = filterUsers(users, 'charlie yellow');

    expect(result).toHaveLength(1);
    expect(result[0].first_name).toBe('Charlie');
    expect(result[0].last_name).toBe('Yellow');
  });

  test('is case-insensitive and trims whitespace', () => {
    const result = filterUsers(users, '  ALIce  ');

    expect(result).toHaveLength(1);
    expect(result[0].first_name).toBe('Alice');
  });
});
