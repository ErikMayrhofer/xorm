export function quickMockServerAdapter() {
  const adapter = {
    delete: jest.fn((id) => new Promise((resolve) => setTimeout(resolve, 0))),
    save: jest.fn((id) => new Promise((resolve) => setTimeout(resolve, 0))),
  };
  return adapter;
}
