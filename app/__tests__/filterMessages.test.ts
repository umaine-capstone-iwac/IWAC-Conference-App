import { filterMessages } from '../utils/filterMessages';

type MessageUser = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  timestamp?: string | null;
};

const users: MessageUser[] = [
  {
    id: '1',
    first_name: null,
    last_name: 'Curie',
    timestamp: '2026-02-08 18:38:40+00',
  },
  {
    id: '2',
    first_name: 'Alice',
    last_name: 'Zephyr',
    timestamp: '2026-02-24 14:43:09.663143+00',
  },
  {
    id: '3',
    first_name: 'Bob',
    last_name: 'Yellow',
    timestamp: '2026-02-24 15:12:38.446+00',
  },
  {
    id: '4',
    first_name: 'Charlie',
    last_name: 'Yellow',
    timestamp: '2026-02-24 15:12:38.447+00',
  },
  {
    id: '5',
    first_name: null,
    last_name: 'Yellow',
    timestamp: '2026-02-10 10:00:00+00',
  },
  {
    id: '6',
    first_name: 'David',
    last_name: null,
    timestamp: '2026-02-24 16:00:00+00',
  },
  {
    id: '7',
    first_name: null,
    last_name: null,
    timestamp: '2026-02-25 00:00:00+00',
  },
];

describe('filterMessages', () => {
  test('returns all users sorted by most recent timestamp when search is empty', () => {
    const result = filterMessages(users, '');

    expect(result.map((u) => u.id)).toEqual([
      '7', // 2026-02-25 00:00:00+00
      '6', // 2026-02-24 16:00:00+00
      '4', // 2026-02-24 15:12:38.447+00
      '3', // 2026-02-24 15:12:38.446+00
      '2', // 2026-02-24 2026-02-24 14:43:09.663143+00
      '5', // 2026-02-10 10:00:00+00
      '1', // 2026-02-08 18:38:40+00
    ]);
  });

  test('filters by first name', () => {
    const result = filterMessages(users, 'alice');

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('2');
  });

  test('filters by last name', () => {
    const result = filterMessages(users, 'Zephyr');

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('2');
  });

  test('filters by full name', () => {
    const result = filterMessages(users, 'charlie yellow');

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('4');
  });

  test('is case-insensitive and trims whitespace', () => {
    const result = filterMessages(users, '   ALIce   ');

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('2');
  });

  test('maintains correct ordering among near-identical timestamps', () => {
    const result = filterMessages(users, 'yellow');

    expect(result.map((u) => u.id)).toEqual([
      '4', // 2026-02-24 15:12:38.447+00
      '3', // 2026-02-24 15:12:38.446+00
      '5', // 2026-02-10 10:00:00+00
    ]);
  });
});
