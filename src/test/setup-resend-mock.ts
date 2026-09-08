import { vi } from "vitest";

vi.mock("resend", () => ({
  Resend: class {
    emails = {
      send: vi
        .fn()
        .mockResolvedValue({ data: { id: "mock-email-id" }, error: null }),
    };
  },
}));
